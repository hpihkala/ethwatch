module.exports = {
  webpack: {
    configure: (config) => {
      if (config.optimization && Array.isArray(config.optimization.minimizer)) {
        config.optimization.minimizer.forEach((minimizer) => {
          const isTerser = minimizer && minimizer.constructor && minimizer.constructor.name === 'TerserPlugin'
          if (isTerser) {
            const existing = minimizer.options.terserOptions || {}
            minimizer.options.terserOptions = {
              ...existing,
              parse: { ecma: 2020, ...(existing.parse || {}) },
              compress: { ecma: 2020, ...(existing.compress || {}) },
              mangle: { ...(existing.mangle || {}) },
              format: { ecma: 2020, ...(existing.format || existing.output || {}) },
            }
          }
        })
      }
      return config
    }
  }
}


