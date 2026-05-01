import renderMainMenu from "./_menu"
import { Nav } from "../components/_nav"
import { OnThisPageContent } from "../components/_onThisPage"
import { handleScroll } from "../utils"
import Seo from "../components/seo"

import React, { useEffect, useCallback, useState } from "react"
import Prism from "prismjs"
import { initFlowbite } from "flowbite"
import "prismjs/themes/prism-tomorrow.css"
import "prismjs/components/prism-json"
import "prismjs/components/prism-graphql"
import "prismjs/components/prism-python"

/** Header component */
const Header = () => {
  return (
    <header className="sticky top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
      <Nav />
    </header>
  )
}

/** Side Bar nav component  */
const SideBarComponent = (props: { menu: any[]; entry: { document: { slug: string } } | null }) => {
  return (
    <>
      <aside
        id="sidebar-multi-level-sidebar"
        className="fixed inset-0 z-20 hidden h-full w-72 flex-none lg:static lg:block lg:h-auto lg:w-96 lg:overflow-y-visible lg:pt-0"
        aria-labelledby="sidebar-label"
      >
        <div
          id="navWrapper"
          className="scrolling-touch max-w-2xs top:24 z-20 h-full overflow-y-auto bg-white dark:bg-gray-900 lg:sticky lg:top-28 lg:mr-0 lg:block lg:h-[calc(100vh-3rem)]"
        >
          <nav
            id="nav"
            className="sticky?lg:h-(screen-18) px-1 pb-20 pl-3 pt-16 text-base font-normal lg:pb-20 lg:pl-0 lg:pt-2 lg:text-sm"
            aria-label="Docs navigation"
          >
            <ul className="tdb__li space-y-2 font-medium ">
              {renderMainMenu(props.menu, props.entry)}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}

/** Main body of page */
const MainContent = (props: { displayElement: React.ReactNode; heading: React.ReactNode; subtitle: React.ReactNode }) => {
  const [onThisPage, setOnThisPage] = useState<React.ReactNode>("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      Prism.highlightAll()
      handleScroll()
      initFlowbite()
      document
        .getElementById("sidebar-multi-level-sidebar")
        ?.classList.add("hidden")
      setOnThisPage(<OnThisPageContent />)
    }
  }, [props.displayElement])

  return (
    <main
      id="content-wrapper"
      className="w-full min-w-0 flex-auto lg:static lg:max-h-full lg:overflow-visible"
    >
      <div className="flex w-full">
        <div className="pb:12 min-w-0 max-w-4xl flex-auto pt-6 lg:px-8 lg:pb-16 lg:pt-8 xl:pb-24">
          <div id="mainContent">
            <div className="mb-4 border-b border-gray-200 pb-2 dark:border-gray-800">
              <h1 className="font-barlow font-semibold">{props.heading}</h1>
            </div>
            <h2 className="tdb__subtitle font-barlow font-semibold">
              {props.subtitle}
            </h2>
            {props.displayElement}
          </div>
        </div>
        {onThisPage}
      </div>
    </main>
  )
}

/** layout for all pages to be displayed */
export const Layout = (props: { seo_metadata?: { title: string; description: string; og_image: string }; menu: any[]; entry: { document: { slug: string } } | null; displayElement: React.ReactNode; heading: React.ReactNode; subtitle: React.ReactNode }) => {
  return (
    <>
      <Header />
      <Seo seo_metadata={props.seo_metadata} />
      <div className="max-w-8xl container mx-auto w-full px-4">
        <div className="lg:flex">
          <SideBarComponent {...props} />
          {
            <div
              className="fixed inset-0 z-10 hidden bg-gray-900/50 dark:bg-gray-900/60"
              id="sidebarBackdrop"
            />
          }
          <MainContent {...props} />
        </div>
      </div>
    </>
  )
}
