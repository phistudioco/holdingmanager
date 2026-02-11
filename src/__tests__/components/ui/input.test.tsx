import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with different types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text')

    rerender(<Input type="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')

    rerender(<Input type="date" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'date')
  })

  it('handles value changes', async () => {
    const handleChange = vi.fn()
    const { user } = render(
      <Input onChange={handleChange} data-testid="input" />
    )

    const input = screen.getByTestId('input')
    await user.type(input, 'test value')

    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('test value')
  })

  it('can be disabled', async () => {
    const handleChange = vi.fn()
    const { user } = render(
      <Input disabled onChange={handleChange} data-testid="input" />
    )

    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:opacity-50')

    await user.type(input, 'test')
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('can be read-only', async () => {
    const { user } = render(
      <Input readOnly defaultValue="read only value" data-testid="input" />
    )

    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveValue('read only value')

    await user.type(input, 'new text')
    expect(input).toHaveValue('read only value')
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Input ref={ref} data-testid="input" />)
    expect(ref).toHaveBeenCalled()
  })

  it('supports controlled value', async () => {
    const ControlledInput = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="input"
        />
      )
    }

    const { user } = render(<ControlledInput />)
    const input = screen.getByTestId('input')

    await user.type(input, 'controlled')
    expect(input).toHaveValue('controlled')
  })

  it('supports uncontrolled default value', () => {
    render(<Input defaultValue="default" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveValue('default')
  })

  it('handles focus and blur events', async () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    const { user } = render(
      <Input onFocus={handleFocus} onBlur={handleBlur} data-testid="input" />
    )

    const input = screen.getByTestId('input')
    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('accepts name and id attributes', () => {
    render(<Input name="email" id="email-input" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('id', 'email-input')
  })

  it('accepts required attribute', () => {
    render(<Input required data-testid="input" />)
    expect(screen.getByTestId('input')).toBeRequired()
  })

  it('accepts min and max for number inputs', () => {
    render(<Input type="number" min={0} max={100} data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })

  it('accepts pattern attribute', () => {
    render(<Input pattern="[A-Za-z]+" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('pattern', '[A-Za-z]+')
  })
})

// Need to import React for the controlled component test
import React from 'react'
