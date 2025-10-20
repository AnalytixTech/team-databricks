import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  let originalOverflow: string;

  beforeEach(() => {
    originalOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Modal content
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()}>
          Modal content
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('should display title when provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );
      expect(screen.getByRole('heading', { name: 'Test Modal' })).toBeInTheDocument();
    });

    it('should not display title when not provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('should show close button by default', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      // Close button is the only button in the modal
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
          Content
        </Modal>
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );
      
      const closeButton = screen.getAllByRole('button')[0];
      await user.click(closeButton);
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('backdrop', () => {
    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );
      
      const backdrop = container.querySelector('.bg-black\\/50') as HTMLElement;
      await user.click(backdrop);
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('sizes', () => {
    it('should render medium size by default', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const modal = container.querySelector('.max-w-lg');
      expect(modal).toBeInTheDocument();
    });

    it('should render small size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="sm">
          Content
        </Modal>
      );
      const modal = container.querySelector('.max-w-md');
      expect(modal).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="lg">
          Content
        </Modal>
      );
      const modal = container.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    it('should render xl size', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} size="xl">
          Content
        </Modal>
      );
      const modal = container.querySelector('.max-w-4xl');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('body scroll lock', () => {
    it('should set body overflow to hidden when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should restore body overflow on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('content', () => {
    it('should render children content', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div>Custom content</div>
          <button>Action Button</button>
        </Modal>
      );
      expect(screen.getByText('Custom content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('should render complex nested content', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Complex Modal">
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Modal>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have backdrop blur effect', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have modal shadow and rounded corners', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const modal = container.querySelector('.rounded-xl.shadow-xl');
      expect(modal).toBeInTheDocument();
    });

    it('should be scrollable when content overflows', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const modal = container.querySelector('.overflow-y-auto');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper z-index for overlay', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      );
      const overlay = container.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });
});

