import { readFile, writeFile } from "node:fs/promises"
import axios from "axios"
import "dotenv/config"

async function fetchMenu() {
  const config = {
    headers: { Authorization: `Token ${process.env.TERMINUSDB_API_TOKEN}` },
  }
  const req = await axios.post(
    `${process.env.TERMINUSDB_API_ENDPOINT}/api/graphql/${process.env.TERMINUSDB_TEAM}/${process.env.TERMINUSDB_DB}`,
    {
      query: `query {
        Menu(orderBy: {Order:ASC}) {
          MenuTitle,
          Order,
          menu_order,
          Level1(orderBy: {Order:ASC})  {
            Menu1Label,
            Order,
            Menu1Page {
              slug
            },
            Level2(orderBy: {Order:ASC})  {
              Menu2Label,
              Order,
              Menu2Page{
                slug
              },
              Level3(orderBy: {Order:ASC})  {
                Menu3Label,
                Order,
                Menu3Page {
                  slug
                }
              }
            }
          }
        }
      }`,
    },
    config
  )
  const sortedMenu = req.data.data.Menu.sort((a, b) =>
    a.menu_order > b.menu_order ? 1 : -1
  )
  await writeFile("src/menu.json", JSON.stringify(sortedMenu))
  return sortedMenu
}

await fetchMenu()
