/* eslint-disable @next/next/no-img-element */
import Image from "next/image"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })
import "flowbite"
import Link from "next/link"
import {
  checkIfMenuOpen,
  getActiveSlugClassName,
  checkIfSubMenuOpen,
} from "../utils"

const menuClassName =
  "text-base flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"

function getSlug(slug: string) {
  if (slug[0] === "/") {
    return slug
  }
  return "/" + slug
}

function getMenuId(menuLabel: string) {
  return menuLabel.replaceAll(" ", "_")
}

/** level 3 */
function renderLevel3Menu(menuLevel3: any[], entry: any[]) {
  const level3Items = menuLevel3.map((level3, index) => {
    let activeClassName = getActiveSlugClassName(level3, entry, 3)
    return (
      <li key={`level3_${index}`}>
        <Link
          href={getSlug(level3.Menu3Page.slug)}
          className={`${menuClassName} pl-16 ${activeClassName} font-barlow font-normal`}
        >
          {level3.Menu3Label}
        </Link>
      </li>
    )
  })
  return level3Items
}

/** level 2 */
function renderLevel2Menu(menuLevel2: any[], entry: any[]) {
  const level2Items = menuLevel2.map((level2, index) => {
    if (typeof level2 === "undefined") {
      return ""
    }

    let activeClassName = getActiveSlugClassName(level2, entry, 2)

    if (Array.isArray(level2.Level3) && !level2.Level3.length) {
      /** menu with no level 3 */
      return (
        <li key={`level2_${index}`}>
          <Link
            href={getSlug(level2.Menu2Page.slug)}
            className={`${menuClassName} pl-11 ${activeClassName} font-barlow font-normal`}
          >
            {level2.Menu2Label}
          </Link>
        </li>
      )
    }

    //let className  =  checkIfMenuOpen(level2, entry, 3)
    //let className  = level2.Menu2Page.slug === entry.document.slug ? "" : "hidden"
    let className = checkIfSubMenuOpen(level2, entry, 2)

    /** menu with level 3 */
    return (
      <li key={`level2_${index}`}>
        <button
          type="button"
          className={`${menuClassName} pl-11 font-barlow font-normal ${activeClassName}`}
          aria-controls={getMenuId(level2.Menu2Label)}
          data-collapse-toggle={getMenuId(level2.Menu2Label)}
        >
          <Link
            href={getSlug(level2.Menu2Page.slug)}
            className="tdb__menu__links"
          >
            <span
              className="flex-1 whitespace-nowrap text-left"
              sidebar-toggle-item
            >
              {level2.Menu2Label}
            </span>
          </Link>
          <svg
            sidebar-toggle-item
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
        <ul
          id={getMenuId(level2.Menu2Label)}
          className={`${className} tdb__li space-y-2 py-2`}
        >
          {renderLevel3Menu(level2.Level3, entry)}
        </ul>
      </li>
    )
  })
  return level2Items
}

/** level 1 */
function renderLevel1Menu(menuLevel1: any[], entry: any[]) {
  const menuItems = menuLevel1.map(
    (
      level1: {
        Level2?: any
        Menu1Page?: any
        Menu1Label?: any
        Level1?: any[]
      },
      index: any
    ) => {
      let activeClassName = getActiveSlugClassName(level1, entry, 1)

      if (Array.isArray(level1.Level2) && !level1.Level2.length) {
        /** menu with no level 2 */
        return (
          <li key={level1.Menu1Page.slug}>
            <Link
              href={getSlug(level1.Menu1Page.slug)}
              className={`${menuClassName} pl-6 ${activeClassName} font-barlow font-normal`}
            >
              <span>{level1.Menu1Label}</span>
            </Link>
          </li>
        )
      }

      //let className  =  checkIfMenuOpen(level1, entry, 2)

      let className = checkIfSubMenuOpen(level1, entry, 1)

      /** menu with level 2 */
      return (
        <li key={`level1_${index}`}>
          <button
            type="button"
            className={`${menuClassName} pl-6 font-barlow font-normal ${activeClassName}`}
            aria-controls={getMenuId(level1.Menu1Label)}
            data-collapse-toggle={getMenuId(level1.Menu1Label)}
          >
            <Link
              href={getSlug(level1.Menu1Page.slug)}
              className="tdb__menu__links"
            >
              <span
                className="flex-1 whitespace-nowrap text-left"
                sidebar-toggle-item
              >
                {level1.Menu1Label}
              </span>
            </Link>
            <svg
              sidebar-toggle-item
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
          <ul
            id={getMenuId(level1.Menu1Label)}
            className={`${className} tdb__li space-y-2 py-2`}
          >
            {renderLevel2Menu(level1.Level2, entry)}
          </ul>
        </li>
      )
    }
  )
  return menuItems
}

/** level 0 */
export default function renderMainMenu(menu: any[], entry: any[]) {
  const mainMenuItems = menu.map((menuItem, index) => {
    let className = checkIfMenuOpen(menuItem, entry, 1)

    return (
      <li key={index}>
        <button
          type="button"
          className={`${menuClassName} font-barlow font-normal`}
          aria-controls={getMenuId(menuItem.MenuTitle)}
          data-collapse-toggle={getMenuId(menuItem.MenuTitle)}
        >
          <span
            className="flex-1 whitespace-nowrap text-left"
            sidebar-toggle-item
          >
            {menuItem.MenuTitle}
          </span>
          <svg
            sidebar-toggle-item
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
        <ul
          id={getMenuId(menuItem.MenuTitle)}
          className={`${className} tdb__li space-y-2 py-2`}
        >
          {renderLevel1Menu(menuItem.Level1, entry)}
        </ul>
      </li>
    )
  })

  return mainMenuItems
}
