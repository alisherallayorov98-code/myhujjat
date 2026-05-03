import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('totalPages === 1 bo\'lsa, hech narsa render qilmaydi', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('5 sahifada barcha raqamlar ko\'rinadi (... yo\'q)', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.queryByText('...')).not.toBeInTheDocument()
  })

  it('20 sahifada compact format (1 ... 4 5 6 ... 20)', () => {
    render(<Pagination page={5} totalPages={20} onPageChange={() => {}} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()  // current
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getAllByText('...').length).toBeGreaterThanOrEqual(1)
  })

  it("current page ajratib ko'rsatiladi (font-medium klassi bilan)", () => {
    render(<Pagination page={3} totalPages={5} onPageChange={() => {}} />)
    const currentBtn = screen.getByText('3')
    expect(currentBtn.className).toContain('bg-[#2563EB]')  // primary color
  })

  it('keyingi sahifa bosilganda onPageChange chaqiradi', () => {
    const onChange = vi.fn()
    render(<Pagination page={3} totalPages={10} onPageChange={onChange} />)
    fireEvent.click(screen.getByText('4'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('birinchi sahifada Prev tugmasi disabled', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />)
    const prev = screen.getByLabelText('Previous page')
    expect(prev).toBeDisabled()
  })

  it('oxirgi sahifada Next tugmasi disabled', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />)
    const next = screen.getByLabelText('Next page')
    expect(next).toBeDisabled()
  })

  it('Next bosilganda page+1', () => {
    const onChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('Prev bosilganda page-1', () => {
    const onChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Previous page'))
    expect(onChange).toHaveBeenCalledWith(2)
  })
})
