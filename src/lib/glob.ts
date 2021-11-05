import globby from 'globby'

export default (patterns: string[], options?: globby.GlobbyOptions) =>
  globby.sync(patterns, options)
