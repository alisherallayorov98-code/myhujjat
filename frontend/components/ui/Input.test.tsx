import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input, Textarea } from './Input'

describe('Input', () => {
  it("label va placeholder render qiladi", () => {
    render(<Input label="Ism" placeholder="To'liq ismingizni kiriting" />)
    expect(screen.getByText('Ism')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("To'liq ismingizni kiriting")).toBeInTheDocument()
  })

  it("required=true bo'lsa — yulduzcha (*)", () => {
    render(<Input label="Email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it("hint matni ko'rsatiladi (xato yo'q)", () => {
    render(<Input hint="Misol: user@example.com" />)
    expect(screen.getByText('Misol: user@example.com')).toBeInTheDocument()
  })

  it("error bo'lsa — hint o'rniga xato + qizil border", () => {
    const { container } = render(
      <Input hint="Hint matni" error="Xato!" />
    )
    expect(screen.getByText(/Xato!/)).toBeInTheDocument()
    expect(screen.queryByText('Hint matni')).not.toBeInTheDocument()
    const input = container.querySelector('input')!
    expect(input.className).toContain('border-[#DC2626]')
  })

  it("onChange chaqiriladi", () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalled()
  })

  it("disabled=true — input chaqirib bo'lmaydi", () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toBeDisabled()
  })
})

describe('Textarea', () => {
  it("label va placeholder render qiladi", () => {
    render(<Textarea label="Tavsif" placeholder="Tavsifni kiriting" />)
    expect(screen.getByText('Tavsif')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tavsifni kiriting')).toBeInTheDocument()
  })

  it("error bo'lsa — qizil border", () => {
    const { container } = render(<Textarea error="Maydon kerak" />)
    expect(screen.getByText(/Maydon kerak/)).toBeInTheDocument()
    const textarea = container.querySelector('textarea')!
    expect(textarea.className).toContain('border-[#DC2626]')
  })
})
