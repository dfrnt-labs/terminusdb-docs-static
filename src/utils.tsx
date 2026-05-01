/* eslint-disable @next/next/no-img-element */

// from: https://www.javascripttutorial.net/dom/css/check-if-an-element-is-visible-in-the-viewport/
function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/** function to handle scroll  */
export function handleScroll() {
  const observer = new IntersectionObserver((entries) => {
    //        document.querySelectorAll(`a[class="tdb__on__this__page__links"]`).forEach(x => x.parentElement.classList.remove('active'));
    let highest = null
    let prevTop = 1000
    entries.forEach((entry) => {
      const id = entry.target.getAttribute("id")
      const element = document.querySelector(
        `a[class="tdb__on__this__page__links"][href="#${id}"]`
      )
      if (entry.target.clientTop < prevTop) {
        prevTop = entry.target.clientTop
        highest = element
      }
      if (element === null) {
        return
      }
      if (entry.intersectionRatio > 0) {
        element.parentElement?.classList.add("active")
        if (!isInViewport(element)) {
          element.scrollIntoView()
        }
      } else {
        element.parentElement?.classList.remove("active")
      }
    })
  })

  const options = {
    threshold: 0,
  }

  // Track all sections that have an `id` applied
  document.querySelectorAll("h2[id],h3[id],h4[id]").forEach((section) => {
    observer.observe(section)
  })
}

export function renderExamples(examples: string[], language: string, func: string) {
  let count = 0
  const rows = examples.map((example: string) => {
    count = count + 1
    return (
      <pre key={`${func}-${count}-code}`} className={"language-" + language}>
        <code className={"language-" + language}>{example}</code>
      </pre>
    )
  })
  return (
    <>
      <h5>Examples</h5>
      {rows}
    </>
  )
}

export function renderCodeTable(parameters: { name: string; type: string; summary: string }[]) {
  const rows = parameters.map((param: { name: string; type: string; summary: string }) => {
    return (
      <tr key={"tr" + param.name}>
        <td>{param.name}</td>
        <td>{param.type}</td>
        <td>{param.summary}</td>
      </tr>
    )
  })
  return (
    <>
      <h5>Parameters</h5>
      <table>
        <thead>
          <tr>
            <th>
              {" "}
              <strong>Name </strong>
            </th>
            <th>
              {" "}
              <strong>Type </strong>
            </th>
            <th>
              {" "}
              <strong>Description</strong>
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </>
  )
}

/**
 *
 * @param menuItem menu Item list
 * @param entry current entry ( current menu clicked by user )
 * @param index menu index level
 * @returns checks if menu has to be open based on current entry
 * if no match found then menu will be folded with className `hidden`
 * if match found then we remove hidden className to unfold the menu item
 */
export function checkIfMenuOpen(
  menuItem: Record<string, unknown>,
  entry: { document: { slug: string } } | null,
  index: number
): string {
  let className = "hidden"
  if (!entry) return className
  const levelKey = `Level${index}`
  const levelArray = menuItem[levelKey]
  if (Array.isArray(levelArray)) {
    levelArray.map((level: Record<string, unknown>) => {
      // match Found
      const menuPage = level[`Menu${index}Page`] as { slug: string } | undefined
      if (menuPage && menuPage.slug === entry.document.slug) {
        className = ""
      }
      // loop further to next menu levels
      const nextIndex = index + 1
      const nextLevelClassNames = checkIfMenuOpen(level, entry, nextIndex)
      if (nextLevelClassNames !== "hidden") className = nextLevelClassNames
    })
  }

  return className
}

export function checkIfSubMenuOpen(
  menuItem: Record<string, unknown>,
  entry: { document: { slug: string } } | null,
  index: number
): string {
  //let className  = level2.Menu2Page.slug === entry.document.slug ? "" : "hidden"
  let className = "hidden"
  if (!entry) return className
  const menuPage = menuItem[`Menu${index}Page`] as { slug: string } | undefined
  if (menuPage && menuPage.slug === entry.document.slug) {
    className = ""
  }
  const nextIndex = index + 1
  const nextLevelArray = menuItem[`Level${nextIndex}`]
  if (Array.isArray(nextLevelArray)) {
    nextLevelArray.map((level: Record<string, unknown>) => {
      const nextLevelClassNames = checkIfSubMenuOpen(level, entry, nextIndex)
      if (nextLevelClassNames !== "hidden") {
        className = nextLevelClassNames
        return className
      }
    })
  }

  return className
}

/**
 *
 * @param  menuItem menu Item list
 * @param entry current entry ( current menu clicked by user )
 * @param index menu index level
 * @returns className activeMenu when slug matches menu List slug
 */
export function getActiveSlugClassName(
  menuItem: Record<string, unknown>,
  entry: { document: { slug: string } } | null,
  index: number
): string {
  let className = ""
  if (!entry) return className
  const menuPage = menuItem[`Menu${index}Page`] as { slug: string } | undefined
  // this menu is active
  if (menuPage && menuPage.slug === entry.document.slug) {
    className = "activeMenu"
  }
  return className
}

export function getLogo() {
  return (
    <a href="https://terminusdb.org/" className="flex items-center pl-2.5">
      <img
        src="https://assets.terminusdb.com/docs/TerminusDB-Logo.svg"
        className="mb-0 mt-0"
        width="250"
        height="250"
        decoding="async"
        alt="TerminusDB Logo"
      />
    </a>
  )
}

/**
 *
 * @param link anchor heading links
 * @returns anchor ids
 */
export function formatAnchorIds(link: string) {
  let id = link.replace(/[^A-Z0-9]/gi, "")
  return id.toLowerCase()
}

/**
 *
 * @param funcName function name
 * @param shortArgs function args
 * @returns formated string with repective function name & arguments
 */
export function formatShortHandAnchorIds(funcName: string, shortArgs: string | null | undefined) {
  if (!shortArgs) return funcName
  return `${funcName}(${shortArgs})`
}

export function getHtml(entry: { [x: string]: any }) {
  return entry["html"]
}

export function getSubTitle(document: { subtitle: { value: any } }) {
  if (!document.subtitle) return <div />
  return document.subtitle.value
}
