@description('AgriValue backend on Azure App Service (Linux Node 20)')
param location string = resourceGroup().location
param appName string = 'agrivalue-iq-${uniqueString(resourceGroup().id)}'

var appServicePlanName = '${appName}-plan'

resource plan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: { name: 'B1', tier: 'Basic' }
  kind: 'linux'
  properties: { reserved: true }
}

resource app 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'npm start'
      appSettings: [
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'CORS_ORIGINS', value: 'https://cdm227.github.io' }
      ]
    }
  }
}

output webAppName string = app.name
output defaultHostName string = app.properties.defaultHostName
output apiUrl string = 'https://${app.properties.defaultHostName}'
