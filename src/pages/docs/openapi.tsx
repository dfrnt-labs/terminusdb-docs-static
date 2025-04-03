import { OnThisPageContent } from "../../components/_onThisPage"
import menu from "../../menu.json"
import dynamic from "next/dynamic"
const SwaggerUI = dynamic(import("swagger-ui-react"), { ssr: false })
import "swagger-ui-react/swagger-ui.css"
import { Layout } from "../../components/_layout"

//        <div dangerouslySetInnerHTML={{__html: props.html }}/>
export default function Home(props) {
  const layout = (
    <>
      <SwaggerUI url="https://raw.githubusercontent.com/terminusdb/terminusdb/main/docs/openapi.yaml" />
    </>
  )
  return (
    <Layout
      menu={props.menu}
      displayElement={layout}
      entry={props.entry}
      heading="OpenAPI spec"
    />
  )
}

export async function getStaticProps(context) {
  // provide entry slug
  const entry = { document: { slug: `openapi` } }
  return { props: { menu, entry } }
}
