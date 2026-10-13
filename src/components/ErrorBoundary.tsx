import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 560 }}>
          <h1>Coś poszło nie tak</h1>
          <p style={{ color: '#666' }}>{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null })
              window.location.assign('/')
            }}
            style={{ padding: '0.6rem 1rem', cursor: 'pointer' }}
          >
            Odśwież stronę
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
