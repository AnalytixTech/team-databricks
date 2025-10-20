import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('should render badge with children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  describe('variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should render success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should render warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should render danger variant', () => {
      const { container } = render(<Badge variant="danger">Danger</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should render info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('styling', () => {
    it('should have base styling classes', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-medium'
      );
    });

    it('should accept custom className', () => {
      const { container } = render(<Badge className="ml-2">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('ml-2');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Badge className="uppercase">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('uppercase', 'inline-flex', 'bg-gray-100');
    });
  });

  describe('HTML attributes', () => {
    it('should forward HTML attributes', () => {
      const { container } = render(<Badge data-testid="test-badge">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('data-testid', 'test-badge');
    });

    it('should handle onClick event', () => {
      const handleClick = vi.fn();
      const { container } = render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = container.firstChild as HTMLElement;
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('different content types', () => {
    it('should render text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('should render numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render mixed content', () => {
      render(<Badge>v2.0.1</Badge>);
      expect(screen.getByText('v2.0.1')).toBeInTheDocument();
    });
  });
});

