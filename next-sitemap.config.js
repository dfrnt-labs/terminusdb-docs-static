/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://terminusdb.org/',
  generateRobotsTxt: true, // (optional)
  output: "export",
  trailingSlash: true,
  // ...other options
}
