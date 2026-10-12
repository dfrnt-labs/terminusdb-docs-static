"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useConnection } from "./ConnectionSettings/ConnectionContext"
import { ConnectionIcon } from "./ConnectionSettings/ConnectionIcon"

type ResourceKind = "user" | "role" | "organization" | "database"
type ResourceStatus = "checking" | "exists" | "missing" | "error"

interface Resource {
  kind: ResourceKind
  /** Identifier used in API paths (username, org name, db label, role name) */
  name: string
  /** Label shown to the reader */
  display: string
}

interface ResourceSetupProps {
  /** Comma-separated usernames to create */
  readonly users?: string
  /** Organisation name to create */
  readonly organization?: string
  /** Database label to create inside `organization` */
  readonly database?: string
  /** Custom role name to create */
  readonly role?: string
  /** Comma-separated action names for the custom role */
  readonly roleActions?: string
  /** Password assigned to created users */
  readonly password?: string
  /** Heading shown above the resource list */
  readonly label?: string
}

function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ResourceSetup({
  users,
  organization,
  database,
  role,
  roleActions,
  password = "password",
  label = "Example resources",
}: ResourceSetupProps) {
  const { settings, connectionStatus } = useConnection()
  const [statuses, setStatuses] = useState<Record<string, ResourceStatus>>({})
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const prevConnectionStatus = useRef(connectionStatus)

  const base = settings.serverUrl.replace(/\/+$/, "")
  const auth = "Basic " + btoa(`${settings.user}:${settings.password}`)

  // Build the resource list once from props — order is creation order
  const resources: Resource[] = []
  if (role) resources.push({ kind: "role", name: role, display: `role ${role}` })
  for (const u of splitList(users)) {
    resources.push({ kind: "user", name: u, display: `user ${u}` })
  }
  if (organization) {
    resources.push({ kind: "organization", name: organization, display: `organisation ${organization}` })
  }
  if (organization && database) {
    resources.push({ kind: "database", name: database, display: `database ${organization}/${database}` })
  }

  const keyOf = (r: Resource) => `${r.kind}:${r.name}`

  // Lists the org's databases with paths — shared by the existence check and
  // (with @id selection) the capability sweep
  const orgDatabaseList = useCallback(
    async (org: string): Promise<Array<{ path?: string }>> => {
      const res = await fetch(`${base}/api/db/${org}`, {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(10000),
      })
      return res.ok ? await res.json() : []
    },
    [base, auth]
  )

const statusText: Record<ResourceStatus, string> = {
  exists: "ready",
  checking: "checking…",
  error: "check failed",
  missing: "not created",
}

function statusIcon(s: ResourceStatus) {
  if (s === "exists") {
    return (
      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40" aria-hidden="true">
        <svg className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    )
  }
  if (s === "checking") {
    return (
      <svg className="h-4 w-4 animate-spin flex-none text-sky-400 dark:text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  return <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full border border-slate-300 dark:border-slate-600" aria-hidden="true" />
}

  const checkAll = useCallback(async () => {
    const next: Record<string, ResourceStatus> = {}
    for (const r of resources) next[keyOf(r)] = "checking"
    setStatuses({ ...next })

    try {
      // List-based checks for users, roles, organisations
      const [usersRes, rolesRes, orgsRes] = await Promise.all([
        fetch(`${base}/api/users`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10000) }),
        fetch(`${base}/api/roles`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10000) }),
        fetch(`${base}/api/organizations`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10000) }),
      ])

      const userList: Array<Record<string, string>> = usersRes.ok ? await usersRes.json() : []
      const roleList: Array<Record<string, string>> = rolesRes.ok ? await rolesRes.json() : []
      const orgList: Array<Record<string, string>> = orgsRes.ok ? await orgsRes.json() : []

      const inList = (list: Array<Record<string, string>>, id: string, name: string) =>
        list.some((item) => item["@id"] === id || item.name === name)

      const kindChecks: Record<"user" | "role" | "organization", [Array<Record<string, string>>, string]> = {
        user: [userList, "User"],
        role: [roleList, "Role"],
        organization: [orgList, "Organization"],
      }
      for (const r of resources) {
        if (r.kind === "database") continue
        const [list, prefix] = kindChecks[r.kind]
        next[keyOf(r)] = inList(list, `${prefix}/${r.name}`, r.name) ? "exists" : "missing"
      }

      // Database check lists the org's databases. GET /api/db/<org>/<db> cannot be
      // used: it resolves access through the caller's own capability graph, so it
      // 404s for admin on databases under other organisations even when they exist.
      if (organization && database) {
        try {
          const dbList = await orgDatabaseList(organization)
          next[`database:${database}`] = dbList.some((d) => d.path === `${organization}/${database}`) ? "exists" : "missing"
        } catch {
          next[`database:${database}`] = "missing"
        }
      }
    } catch {
      for (const k of Object.keys(next)) next[k] = "error"
    }
    setStatuses({ ...next })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, auth, users, organization, database, role, orgDatabaseList])

  useEffect(() => {
    if (connectionStatus === "connected" && prevConnectionStatus.current !== "connected") {
      void checkAll()
    } else if (connectionStatus !== "connected") {
      setStatuses({})
    }
    prevConnectionStatus.current = connectionStatus
  }, [connectionStatus, checkAll])

  useEffect(() => {
    if (connectionStatus === "connected") void checkAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const createOne = useCallback(
    async (r: Resource): Promise<void> => {
      const jsonHeaders = { Authorization: auth, "Content-Type": "application/json" }
      let url: string
      let body: string
      switch (r.kind) {
        case "user":
          url = `${base}/api/users`
          body = JSON.stringify({ name: r.name, password })
          break
        case "role":
          url = `${base}/api/roles`
          body = JSON.stringify({ name: r.name, action: splitList(roleActions) })
          break
        case "organization":
          url = `${base}/api/organizations/${r.name}`
          body = "{}"
          break
        case "database":
          url = `${base}/api/db/${organization}/${r.name}`
          body = JSON.stringify({ label: r.name, comment: "Created by the docs setup widget" })
          break
      }
      const res = await fetch(url, { method: "POST", headers: jsonHeaders, body, signal: AbortSignal.timeout(15000) })
      if (!res.ok) {
        const text = await res.text()
        // Tolerate "already exists" style conflicts — the goal state is reached either way
        if (res.status === 409 || /already exists/i.test(text)) return
        throw new Error(`${r.display}: HTTP ${res.status} — ${text.slice(0, 120)}`)
      }
    },
    [base, auth, password, roleActions, organization]
  )

  // Deleting a resource fails schema validation while a Capability document still
  // references it (DanglingOrganizationReferencedError etc.), so any capabilities
  // scoped to a resource we are deleting — or using a role we are deleting — must
  // be revoked first. Revoking a capability's last role deletes the capability.
  const revokeDanglingCapabilities = useCallback(
    async (scopeIds: Set<string>, roleIds: Set<string>) => {
      if (scopeIds.size === 0 && roleIds.size === 0) return
      const usersRes = await fetch(`${base}/api/users?capability=true`, {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(10000),
      })
      if (!usersRes.ok) return
      const allUsers: Array<Record<string, unknown>> = await usersRes.json()
      const jsonHeaders = { Authorization: auth, "Content-Type": "application/json" }
      const revokeCap = async (userId: unknown, cap: {
        scope?: { "@id"?: string }
        role?: Array<{ "@id"?: string }>
      }) => {
        const scopeId = cap?.scope?.["@id"]
        const capRoleIds = (cap.role ?? []).map((r) => r["@id"]).filter((x): x is string => Boolean(x))
        const toRevoke = scopeId && scopeIds.has(scopeId)
          ? capRoleIds
          : capRoleIds.filter((id) => roleIds.has(id))
        if (toRevoke.length === 0) return
        const res = await fetch(`${base}/api/capabilities`, {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            operation: "revoke",
            scope: scopeId,
            user: userId,
            roles: toRevoke,
          }),
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`revoking capability on ${scopeId}: HTTP ${res.status} — ${text.slice(0, 120)}`)
        }
      }

      // Sequential revokes: order between capabilities does not matter, but
      // serial calls keep server-side state transitions easy to reason about.
      for (const u of allUsers) {
        const caps = (u.capability ?? []) as Array<{
          scope?: { "@id"?: string }
          role?: Array<{ "@id"?: string }>
        }>
        for (const cap of caps) {
          await revokeCap(u["@id"], cap)
        }
      }
    },
    [base, auth]
  )

  // Resolve the UserDatabase @ids for an organisation — needed both for the
  // capability sweep and for db-scoped capability revocation
  const orgDatabaseIds = useCallback(
    async (org: string): Promise<string[]> => {
      try {
        const res = await fetch(`${base}/api/db/${org}?verbose=true`, {
          headers: { Authorization: auth },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return []
        const list: Array<{ "@id"?: string }> = await res.json()
        return list.map((d) => d["@id"]).filter((x): x is string => Boolean(x))
      } catch {
        return []
      }
    },
    [base, auth]
  )

  const deleteOne = useCallback(
    async (r: Resource): Promise<void> => {
      let url: string
      switch (r.kind) {
        case "user":
          url = `${base}/api/users/${r.name}`
          break
        case "role":
          url = `${base}/api/roles/${r.name}`
          break
        case "organization":
          url = `${base}/api/organizations/${r.name}`
          break
        case "database":
          url = `${base}/api/db/${organization}/${r.name}`
          break
      }
      const res = await fetch(url, { method: "DELETE", headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) })
      if (!res.ok && res.status !== 404) {
        const text = await res.text()
        throw new Error(`${r.display}: HTTP ${res.status} — ${text.slice(0, 120)}`)
      }
    },
    [base, auth, organization]
  )

  const handleCreate = useCallback(async () => {
    setBusy(true)
    setErrorMessage("")
    try {
      for (const r of resources) {
        if (statuses[keyOf(r)] !== "exists") await createOne(r)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Create failed")
    }
    setBusy(false)
    void checkAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources.map(keyOf).join(","), statuses, createOne, checkAll])

  // Collect the scope/role IDs whose capabilities must be revoked before
  // their targets can be deleted (schema rejects dangling references)
  const collectCapabilityTargets = useCallback(async () => {
    const scopeIds = new Set<string>()
    const roleIds = new Set<string>()
    for (const r of resources) {
      if (statuses[keyOf(r)] !== "exists") continue
      if (r.kind === "organization") {
        scopeIds.add(`Organization/${r.name}`)
        for (const id of await orgDatabaseIds(r.name)) scopeIds.add(id)
      } else if (r.kind === "database") {
        for (const id of await orgDatabaseIds(organization!)) {
          // Match on the db name embedded in the verbose listing is unreliable;
          // include all the org's dbs — we are deleting the org's contents anyway
          scopeIds.add(id)
        }
      } else if (r.kind === "role") {
        roleIds.add(`Role/${r.name}`)
      }
    }
    return { scopeIds, roleIds }
  }, [resources.map(keyOf).join(","), statuses, orgDatabaseIds, organization]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(async () => {
    setShowConfirmModal(false)
    setBusy(true)
    setErrorMessage("")
    try {
      const { scopeIds, roleIds } = await collectCapabilityTargets()
      await revokeDanglingCapabilities(scopeIds, roleIds)

      // Reverse creation order: database → organisation → users → role
      for (const r of [...resources].reverse()) {
        if (statuses[keyOf(r)] === "exists") await deleteOne(r)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Delete failed")
    }
    setBusy(false)
    void checkAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources.map(keyOf).join(","), statuses, deleteOne, checkAll, collectCapabilityTargets, revokeDanglingCapabilities])

  const anyMissing = resources.some((r) => statuses[keyOf(r)] === "missing" || statuses[keyOf(r)] === undefined)
  const anyExists = resources.some((r) => statuses[keyOf(r)] === "exists")
  const checking = resources.some((r) => statuses[keyOf(r)] === "checking")

  return (
    <>
      <section
        className="my-6 rounded-lg border border-sky-500/20 bg-sky-50 px-5 py-4 dark:border-sky-500/30 dark:bg-slate-800/60"
        aria-label={label}
      >
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{label}</p>

        {connectionStatus !== "connected" && (
          <div className="flex items-center gap-2">
            <ConnectionIcon status="untested" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Connect to TerminusDB first.{" "}
              <button
                className="cursor-pointer text-sky-600 underline decoration-1 underline-offset-2 transition-colors hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded dark:text-sky-400 dark:hover:text-sky-300"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" })
                  window.dispatchEvent(new CustomEvent("open-connection-popover"))
                }}
              >
                Connection settings ›
              </button>
            </p>
          </div>
        )}

        {connectionStatus === "connected" && (
          <div ref={statusRef} tabIndex={-1} aria-live="polite">
            <ul className="mb-3 space-y-1">
              {resources.map((r) => {
                const s = statuses[keyOf(r)] ?? "checking"
                return (
                  <li key={keyOf(r)} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    {statusIcon(s)}
                    <code className="rounded bg-sky-100 px-1 py-0.5 text-xs dark:bg-slate-700">{r.display}</code>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {statusText[s]}
                    </span>
                  </li>
                )
              })}
            </ul>

            {errorMessage && (
              <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center gap-3">
              {anyMissing && (
                <button
                  onClick={handleCreate}
                  disabled={busy || checking}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
                >
                  {busy ? "Working…" : "Create resources"}
                </button>
              )}
              {anyExists && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={busy || checking}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {busy ? "Working…" : "Delete resources"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {showConfirmModal && (
        <ConfirmDeleteModal
          resources={resources.filter((r) => statuses[keyOf(r)] === "exists")}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </>
  )
}

function ConfirmDeleteModal({
  resources,
  onConfirm,
  onCancel,
}: {
  readonly resources: Resource[]
  readonly onConfirm: () => void
  readonly onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
      />
      <div
        className="relative mx-4 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-setup-delete-title"
      >
        <h3 id="resource-setup-delete-title" className="text-sm font-semibold text-slate-900 dark:text-white">
          Delete these resources?
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This permanently deletes the following — databases lose all documents, schema, and commit history:
        </p>
        <ul className="mt-2 space-y-1">
          {resources.map((r) => (
            <li key={`${r.kind}:${r.name}`} className="text-sm text-slate-600 dark:text-slate-300">
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-700">{r.display}</code>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Delete all
          </button>
        </div>
      </div>
    </div>
  )
}
