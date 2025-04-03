import axios from "axios"
const TerminusClient = require("@terminusdb/terminusdb-client")
import {
  renderCodeTable,
  renderExamples,
  formatShortHandAnchorIds,
  formatAnchorIds,
} from "../../utils"
import menu from "../../menu.json"
import { Layout } from "../../components/_layout"

export default function Python(props) {
  const modules = props.application.modules
  const layout = modules.map((mod) => {
    const classes = mod.classes
      .filter((x) => x.memberFunctions.length > 0)
      .map((class_) => {
        const functions = class_.memberFunctions.map((func) => {
          let args = null
          let shortArgs = null
          if (
            typeof func.parameters !== "undefined" &&
            func.parameters.length > 0
          ) {
            args = renderCodeTable(func.parameters)
            shortArgs = func.parameters.map((x) => x.name).join(", ")
          }
          let examples = null
          if (
            typeof func.examples !== "undefined" &&
            func.examples.length > 0
          ) {
            examples = renderExamples(func.examples, "python", func.name)
          }
          return (
            <div key={func.name}>
              <h4
                id={formatAnchorIds(
                  formatShortHandAnchorIds(func.name, shortArgs)
                )}
              >
                {func.name}({shortArgs})
              </h4>
              <div data-accordion="collapse">
                <p>{func.summary}</p>
                {args}
                {examples}
              </div>
            </div>
          )
        })
        return (
          <div key={class_.name}>
            <h3 id={formatAnchorIds(class_.name)}>{class_.name}</h3>
            {functions}
          </div>
        )
      })
    return (
      <div key={mod.name}>
        <h2 id={formatAnchorIds(mod.name)}>{mod.name}</h2>
        {classes}
      </div>
    )
  })

  return (
    <Layout
      menu={props.menu}
      displayElement={layout}
      entry={props.entry}
      seo_metadata={props.entry.document.seo_metadata}
      heading={props.application.name}
    />
  )
}

export async function getStaticProps(context) {
  const client = new TerminusClient.WOQLClient(
    "https://cloud.terminusdb.com/TerminatorsX",
    {
      user: "robin@terminusdb.com",
      organization: "TerminatorsX",
      db: "terminusCMS_docs",
      token: process.env.TERMINUSDB_API_TOKEN,
    }
  )
  const query = {
    "@type": "Page",
    slug: "python",
  }
  const docs = await client.getDocument({
    "@type": "Page",
    as_list: true,
    query: query,
  })
  const docResult = docs[0]

  // provide entry slug
  const entry = { document: docResult }
  const config = {
    headers: { Authorization: `Token ${process.env.TERMINUSDB_API_TOKEN}` },
  }

  const application = await axios.post(
    `${process.env.TERMINUSDB_API_ENDPOINT}/api/graphql/${process.env.TERMINUSDB_TEAM}/${process.env.TERMINUSDB_DB}`,
    {
      query: `query {
            Application(filter: {language: {eq: Python} } ) {
                name,
                modules {
                   name,
                   classes {
                      name,
                      memberFunctions(orderBy: {name: ASC}) {
                          name,
                          examples,
                          section,
                          summary,
                           parameters {
                           default
                           summary
                           name
                           type
                         }
                      }
                   }
                }
            }
       }`,
    },
    config
  )
  return {
    props: {
      application: application.data.data.Application.slice(-1)[0],
      menu,
      entry,
    },
  }
}
