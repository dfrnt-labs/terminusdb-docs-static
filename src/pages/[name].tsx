/* eslint-disable @next/next/no-img-element */
const TerminusClient = require("@terminusdb/terminusdb-client");
const showdown  = require('showdown')
const converter = new showdown.Converter({metadata: true, tables: true})
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);  
import axios from 'axios';
import { BodyContent } from "../components/_body"
import { CollapseSidebar } from "../components/_collapseSidebar"

// Connect and configure the TerminusClient
const client = new TerminusClient.WOQLClient('https://cloud.terminusdb.com/TerminatorsX',
	{
		user:"robin@terminusdb.com",
		organization:'TerminatorsX',
		db: "terminusCMS_docs",
		token: process.env.TERMINUSDB_API_TOKEN
	}
)

export default function Doc( props: JSX.IntrinsicAttributes & { menu: any[]; entry: any[]; } ) {

  
	return <div className='w-full px-4 mx-auto max-w-12xl top-22 fixed bg-gray-50 dark:bg-gray-800'>
    <div className='h-full px-3 py-4 overflow-y-auto '>
      <CollapseSidebar {...props}/>
      <BodyContent entry={props.entry}/>
    </div>
  </div>
}



export async function getStaticPaths() {
	const docs = await client.getDocument({"@type": "Page", as_list: true})
	const paths = docs.filter(x => typeof x['slug'] !== 'undefined' && typeof x['body'] !== 'undefined').map(x => "/" + x["slug"])
	return { paths: paths, fallback: false }
}

    

export async function getStaticProps({ params }) {

	const config = {
		headers: { Authorization: `Token ${process.env.TERMINUSDB_API_TOKEN}` }
	};

	const req = await axios.post('https://cloud.terminusdb.com/TerminatorsX/api/graphql/TerminatorsX/terminusCMS_docs', {
			query: `query {
        Menu(orderBy: {menu_order:ASC}) {
          MenuTitle,
          menu_order,
          Level1(orderBy: {Order:ASC})  {
            Menu1Label,
            Order,
            Menu1Page {
              slug
            },
            Level2(orderBy: {Order:ASC}) {
              Menu2Label,
              Order,
              Menu2Page{
                slug
              },
              Level3(orderBy: {Order:ASC}) {
                Menu3Label,
                Order,
                Menu3Page {
                  slug
                }
              }
            }
          }
        }
      }`
	}, config)
	const menu = req.data.data.Menu


	const query = {
			"@type": "Page",
			"slug": params['name']
	}
	const docs = await client.getDocument({ "@type": "Page", as_list: true, query: query })
	const docResult = docs[0]
	const html = converter.makeHtml(docResult['body']['value'])
	const cleanedHtml = DOMPurify.sanitize(html)
	const entry = {html: cleanedHtml, document: docResult }
	return { props: { entry, menu } }
}
