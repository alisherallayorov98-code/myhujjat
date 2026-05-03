import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal, ConfirmDialog } from './Modal'

describe('Modal', () => {
  it("open=false — render qilmaydi", () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <div>content</div>
      </Modal>
    )
    expect(screen.queryByText('content')).not.toBeInTheDocument()
  })

  it("open=true — content ko'rsatadi", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <div>content</div>
      </Modal>
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it("backdrop bosilganda onClose chaqiradi", () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose}>
        <div>content</div>
      </Modal>
    )
    const backdrop = container.querySelector('.bg-black\\/40')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it("closable=false bo'lsa — backdrop'ni bossa ham yopilmaydi", () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose} closable={false}>
        <div>content</div>
      </Modal>
    )
    const backdrop = container.querySelector('.bg-black\\/40')!
    fireEvent.click(backdrop)
    expect(onClose).not.toHaveBeenCalled()
  })

  it("Escape key bosilganda onClose chaqiradi", () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>content</div>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ConfirmDialog', () => {
  it("title va description ko'rsatadi", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="O'chirilsinmi?"
        description="Bu amal qaytarib bo'lmaydi"
      />
    )
    expect(screen.getByText("O'chirilsinmi?")).toBeInTheDocument()
    expect(screen.getByText("Bu amal qaytarib bo'lmaydi")).toBeInTheDocument()
  })

  it("Confirm bosilganda onConfirm chaqiradi", () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Test"
        confirmText="Ha, o'chir"
      />
    )
    fireEvent.click(screen.getByText("Ha, o'chir"))
    expect(onConfirm).toHaveBeenCalled()
  })

  it("Cancel bosilganda onClose chaqiradi (onConfirm emas)", () => {
    const onClose   = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Test"
        cancelText="Bekor"
      />
    )
    fireEvent.click(screen.getByText("Bekor"))
    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("loading=true bo'lsa Confirm tugmasi disabled", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Test"
        confirmText="O'chir"
        loading={true}
      />
    )
    const btn = screen.getByText("O'chir").closest('button')!
    expect(btn).toBeDisabled()
  })
})
