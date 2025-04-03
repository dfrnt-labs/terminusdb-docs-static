/* eslint-disable @next/next/no-img-element */
const TerminusClient = require("@terminusdb/terminusdb-client")
import Image from "next/image"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })
import axios from "axios"
import "flowbite"
import { getHtml, getSubTitle } from "../../utils"
import menu from "../../menu.json"
import { Layout } from "../../components/_layout"
import { renderMarkdown } from "../../lib/markdown"

export default function Home(props: { menu: any[]; entry: any[] }) {
  let html = getHtml(props.entry)
  let displayElement = <div dangerouslySetInnerHTML={{ __html: html }} />
  return (
    <Layout
      menu={props.menu}
      entry={props.entry}
      displayElement={displayElement}
      heading={props.entry.document?.title?.value ?? ""}
      subtitle={getSubTitle(props.entry.document)}
      seo_metadata={props.entry.document?.seo_metadata}
    />
  )
}

export async function getStaticProps({ params }) {
  // Connect and configure the TerminusClient
  const client = new TerminusClient.WOQLClient(
    process.env.TERMINUSDB_API_ENDPOINT,
    {
      user: process.env.TERMINUSDB_USER,
      organization: process.env.TERMINUSDB_TEAM,
      db: process.env.TERMINUSDB_DB,
      token: process.env.TERMINUSDB_API_TOKEN,
    }
  )
  const query = {
    "@type": "Page",
    slug: "get-started",
  }
  const docs = await client.getDocument({
    "@type": "Page",
    as_list: true,
    query: query,
  })
  const docResult = docs[0]
  let html = await renderMarkdown(docResult?.["body"]?.["value"] ?? "")
  const entry = { html: html, document: docResult ?? null }
  return { props: { menu: menu, entry: entry } }
}
