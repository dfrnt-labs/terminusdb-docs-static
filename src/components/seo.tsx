import Head from "next/head"
import Script from "next/script"

export default function SeoComponent(props) {
  if (typeof props.seo_metadata === "undefined") {
    return (
      <Head>
        <title>TerminusDB documentation</title>
        <meta
          property="og:title"
          content="TerminusDB documentation"
          key="title"
        />
        <meta
          name="description"
          content="The documentation of TerminusDB and TerminusDB"
        />
        <CommonHeaders/>
      </Head>
    )
  }
  return (
    <Head>
      <title>{props.seo_metadata.title}</title>
      <meta
        property="og:title"
        content={props.seo_metadata.title}
        key="title"
      />
      <meta name="description" content={props.seo_metadata.description} />
      <meta property="og:image" content={props.seo_metadata.og_image} />
      <CommonHeaders/>
    </Head>
  )
}

export const CommonHeaders = (props) => <>
  <meta name="algolia-site-verification"  content="63A98BB8F7D12CB0" />
</>

