import detectNewline from 'detect-newline'
import detectIndent from 'detect-indent'

interface FileFormat {
  indent: string | number
  trailingWhitespace: string
}

/**
 * Detects the indentation and trailing whitespace of a file.
 *
 * @param contents contents of the file
 * @returns Formatting of the file
 */
export default function recognizeFormat(contents: string): FileFormat {
  return {
    indent: detectIndent(contents).indent,
    trailingWhitespace: detectNewline(contents) ?? '',
  }
}
