// import dynamic from 'next/dynamic'
// const SwaggerUI = dynamic(import("swagger-ui-react"), { ssr: false })
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import './swaggerdark.css'

export const SwaggerDark = () => {
  return (
    <SwaggerUI url="https://raw.githubusercontent.com/terminusdb/terminusdb/main/docs/openapi.yaml" />
  )
}
