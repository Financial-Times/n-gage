const nPa11yConfig = require('@financial-times/n-pa11y-config')

const parseEnvironmentViewPort = (viewportStr) => {
	const result = /w(\d{2,4})h(\d{2,4})/i.exec(viewportStr)
	if (!result || result.length < 3) {
		return null
	}

	return { width: Number(result[1]), height: Number(result[2]) }
}

const parseEnvironmentViewPorts = (viewports) => {
	if (!viewports) {
		return []
	}
	return viewports.split(',')
		.map(parseEnvironmentViewPort)
		.filter((v) => v)
}

console.log('Running pa11y CI on ', process.env.TEST_URL)

const tests = require('./test/smoke.js')

module.exports = nPa11yConfig({
	tests,
	host: process.env.TEST_URL,
	wait: process.env.PA11Y_WAIT,
	exceptions: process.env.PA11Y_ROUTE_EXCEPTIONS ? process.env.PA11Y_ROUTE_EXCEPTIONS.split(',') : [],
	hide: process.env.PA11Y_HIDE ? process.env.PA11Y_HIDE.split(',') : [],
  viewports: parseEnvironmentViewPorts(process.env.PA11Y_VIEWPORTS),
  // Note: PA11Y_ROUTE_HEADERS in the original file is not used
	headers: {
    'FT-Next-Backend-Key': process.env.FT_NEXT_BACKEND_KEY,
  },
})
