import { describe, it, expect } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import { StatusBadge } from '@/components/common/StatusBadge'

describe('StatusBadge', () => {
  describe('General statuses', () => {
    it('renders actif status with success styling', () => {
      render(<StatusBadge status="actif" />)
      const badge = screen.getByText('Actif')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('renders inactif status with default styling', () => {
      render(<StatusBadge status="inactif" />)
      const badge = screen.getByText('Inactif')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })

    it('renders suspendu status with error styling', () => {
      render(<StatusBadge status="suspendu" />)
      const badge = screen.getByText('Suspendu')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    })

    it('renders en_creation status with info styling', () => {
      render(<StatusBadge status="en_creation" />)
      const badge = screen.getByText('En création')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })
  })

  describe('Employee statuses', () => {
    it('renders en_conge status with warning styling', () => {
      render(<StatusBadge status="en_conge" />)
      const badge = screen.getByText('En congé')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
    })

    it('renders sorti status with default styling', () => {
      render(<StatusBadge status="sorti" />)
      const badge = screen.getByText('Sorti')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })
  })

  describe('Client statuses', () => {
    it('renders prospect status with info styling', () => {
      render(<StatusBadge status="prospect" />)
      const badge = screen.getByText('Prospect')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })
  })

  describe('Invoice statuses', () => {
    it('renders brouillon status with default styling', () => {
      render(<StatusBadge status="brouillon" />)
      const badge = screen.getByText('Brouillon')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })

    it('renders envoyee status with info styling', () => {
      render(<StatusBadge status="envoyee" />)
      const badge = screen.getByText('Envoyée')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('renders partiellement_payee status with warning styling', () => {
      render(<StatusBadge status="partiellement_payee" />)
      const badge = screen.getByText('Partiellement payée')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
    })

    it('renders payee status with success styling', () => {
      render(<StatusBadge status="payee" />)
      const badge = screen.getByText('Payée')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('renders annulee status with error styling', () => {
      render(<StatusBadge status="annulee" />)
      const badge = screen.getByText('Annulée')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    })
  })

  describe('Workflow statuses', () => {
    it('renders en_cours status with info styling', () => {
      render(<StatusBadge status="en_cours" />)
      const badge = screen.getByText('En cours')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('renders approuve status with success styling', () => {
      render(<StatusBadge status="approuve" />)
      const badge = screen.getByText('Approuvé')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('renders rejete status with error styling', () => {
      render(<StatusBadge status="rejete" />)
      const badge = screen.getByText('Rejeté')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    })
  })

  describe('Unknown status', () => {
    it('renders unknown status with default styling and raw status text', () => {
      render(<StatusBadge status="unknown_status" />)
      const badge = screen.getByText('unknown_status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })
  })

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<StatusBadge status="actif" className="custom-class" />)
      const badge = screen.getByText('Actif')
      expect(badge).toHaveClass('custom-class')
    })

    it('has base badge styles', () => {
      render(<StatusBadge status="actif" />)
      const badge = screen.getByText('Actif')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'text-xs', 'font-medium', 'border')
    })
  })
})
