declare module 'git-log-parser' {
  import { Stream } from 'stream'
  import { Commit as SemticCommit } from 'semantic-release'

  interface Commit extends SemticCommit {
    commit: {
      long: string
      short: string
    }
    tree: {
      long: string
      short: string
    }
    author: {
      name: string
      email: string
      short: string
      date: Date
    }
    committer: {
      name: string
      email: string
      short: string
      date: Date
    }
    subject: string
    body: string

    // These fields are added by a "Object.assign"
    hash: string
    message: string
    gitTags: string
    committerDate: string
  }

  const fields: Record<string, any>

  function parse(
    params?: { _?: string[] },
    flags?: { cwd: string; env: Record<string, string | undefined> },
  ): Stream
}
