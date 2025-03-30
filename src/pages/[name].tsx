/* eslint-disable @next/next/no-img-element */
const TerminusClient = require("@terminusdb/terminusdb-client")
import axios from "axios"
import Seo from "../components/seo"
import { Layout } from "../components/_layout"
import { getHtml, getSubTitle } from "../utils"
import menu from "../menu.json"
import Link from "next/link"
import { renderMarkdown } from "../lib/markdown"

function getChildren(document, menu, level) {
  const menuPageSlug = menu[`Menu${level}Page`]["slug"]
  if (document.slug === menuPageSlug) {
    const deeperLevel = level + 1
    const children = menu[`Level${deeperLevel}`].map((child) => {
      return {
        slug: child[`Menu${deeperLevel}Page`]["slug"],
        label: child[`Menu${deeperLevel}Label`],
      }
    })
    return children
  }
  return []
}

function defaultDoc(document, menus) {
  const children = []
  menus.forEach((menu) => {
    menu.Level1.forEach((menu1) => {
      children.push(...getChildren(document, menu1, 1))
      menu1.Level2.forEach((menu2) => {
        children.push(...getChildren(document, menu2, 2))
      })
    })
  })
  const links = children.map((child) => {
    return (
      <Link
        key={child.slug}
        href={"/" + child.slug}
        className="mb-4 block rounded-lg border border-gray-200 bg-white p-6 shadow-md hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        {child.label}
      </Link>
    )
  })
  return <>{links}</>
}

export default function Doc(
  props: JSX.IntrinsicAttributes & { menu: any[]; entry: any[] }
) {
  let html = getHtml(props.entry)
  let displayElement = <div dangerouslySetInnerHTML={{ __html: html }} />
  if (props.entry.document.body === null) {
    displayElement = defaultDoc(props.entry.document, props.menu)
  }
  return (
    <Layout
      menu={props.menu}
      entry={props.entry}
      displayElement={displayElement}
      heading={props.entry.document.title.value}
      subtitle={getSubTitle(props.entry.document)}
      seo_metadata={props.entry.document.seo_metadata}
    />
  )
}

export async function getStaticPaths() {
  // Connect and configure the TerminusClient
  const client = new TerminusClient.WOQLClient(process.env.TERMINUSDB_API_ENDPOINT, {
    user: process.env.TERMINUSDB_USER,
    organization: process.env.TERMINUSDB_TEAM,
    db: process.env.TERMINUSDB_DB,
    token: process.env.TERMINUSDB_API_TOKEN,
  })
  const docs = await client.getDocument({ "@type": "Page", as_list: true })
  const exceptions = ["python", "openapi", "javascript"]
  const paths = docs
    .filter((x) => {
      return typeof x["slug"] !== "undefined" && !exceptions.includes(x["slug"])
    })
    .map((x) => "/" + x["slug"])
  return { paths: paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const config = {
    headers: { Authorization: `Token ${process.env.TERMINUSDB_API_TOKEN}` },
  }
  const doc = await axios.post(
    `${process.env.TERMINUSDB_API_ENDPOINT}/api/graphql/${process.env.TERMINUSDB_TEAM}/${process.env.TERMINUSDB_DB}`,
    {
      query: `query {
    Page(filter: {slug: {eq: "${params["name"]}"}}) {
    slug,
    title {
      value
    },
    body {
      value
    },
    seo_metadata {
      description,
      og_image,
      title
    }
  }
}`,
    },
    config
  )
  const docResult = doc.data.data.Page[0]
  let html = ""
  if (docResult["body"] !== null) {
    html = await renderMarkdown(docResult["body"]?.["value"]??"")
  }
  const entry = { html: html, document: docResult }
  return { props: { entry, menu } }
}
