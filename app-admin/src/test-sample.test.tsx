import { render, screen } from './test-utils'
import { describe, it, expect } from 'vitest'
import React from 'react'

const DummyComponent = () => <div>Hello, Frontend!</div>

describe('Testes base app-admin', () => {
  it('deve renderizar o componente basico', () => {
    render(<DummyComponent />)
    expect(screen.getByText('Hello, Frontend!')).toBeInTheDocument()
  })
})
