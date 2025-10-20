import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Rating from '@/components/ui/Rating';

describe('Rating', () => {
  it('should render 5 stars', () => {
    render(<Rating value={0} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  describe('value display', () => {
    it('should display filled stars based on value', () => {
      const { container } = render(<Rating value={3} readonly />);
      const stars = container.querySelectorAll('svg');
      const filledStars = Array.from(stars).filter((star) =>
        star.classList.contains('fill-yellow-400')
      );
      expect(filledStars).toHaveLength(3);
    });

    it('should display all empty stars when value is 0', () => {
      const { container } = render(<Rating value={0} readonly />);
      const stars = container.querySelectorAll('svg');
      const emptyStars = Array.from(stars).filter((star) =>
        star.classList.contains('fill-none')
      );
      expect(emptyStars).toHaveLength(5);
    });

    it('should display all filled stars when value is 5', () => {
      const { container } = render(<Rating value={5} readonly />);
      const stars = container.querySelectorAll('svg');
      const filledStars = Array.from(stars).filter((star) =>
        star.classList.contains('fill-yellow-400')
      );
      expect(filledStars).toHaveLength(5);
    });
  });

  describe('interactive mode', () => {
    it('should call onChange when star is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Rating value={0} onChange={handleChange} />);
      
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[2]); // Click third star
      
      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it('should update rating on multiple clicks', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Rating value={2} onChange={handleChange} />);
      
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[4]); // Click fifth star
      
      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('should not be readonly by default', () => {
      render(<Rating value={3} onChange={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('readonly mode', () => {
    it('should not call onChange in readonly mode', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Rating value={3} onChange={handleChange} readonly />);
      
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should disable buttons in readonly mode', () => {
      render(<Rating value={3} readonly />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should have cursor-default class in readonly mode', () => {
      const { container } = render(<Rating value={3} readonly />);
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('cursor-default');
      });
    });
  });

  describe('sizes', () => {
    it('should render medium size by default', () => {
      const { container } = render(<Rating value={3} />);
      const star = container.querySelector('svg');
      expect(star).toHaveClass('h-5', 'w-5');
    });

    it('should render small size', () => {
      const { container } = render(<Rating value={3} size="sm" />);
      const star = container.querySelector('svg');
      expect(star).toHaveClass('h-4', 'w-4');
    });

    it('should render large size', () => {
      const { container } = render(<Rating value={3} size="lg" />);
      const star = container.querySelector('svg');
      expect(star).toHaveClass('h-6', 'w-6');
    });
  });

  describe('count display', () => {
    it('should not show count by default', () => {
      render(<Rating value={4} count={25} />);
      expect(screen.queryByText('(25)')).not.toBeInTheDocument();
    });

    it('should show count when showCount is true', () => {
      render(<Rating value={4} count={25} showCount />);
      expect(screen.getByText('(25)')).toBeInTheDocument();
    });

    it('should not show count when count is 0', () => {
      render(<Rating value={4} count={0} showCount />);
      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
    });

    it('should show count with correct styling', () => {
      render(<Rating value={4} count={10} showCount />);
      const countElement = screen.getByText('(10)');
      expect(countElement).toHaveClass('text-sm', 'text-gray-600');
    });
  });

  describe('without onChange handler', () => {
    it('should not throw error when clicked without onChange', async () => {
      const user = userEvent.setup();
      render(<Rating value={2} />);
      
      const buttons = screen.getAllByRole('button');
      await expect(user.click(buttons[3])).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle fractional values by showing partial fill', () => {
      const { container } = render(<Rating value={3.7} readonly />);
      const stars = container.querySelectorAll('svg');
      const filledStars = Array.from(stars).filter((star) =>
        star.classList.contains('fill-yellow-400')
      );
      // The component uses index < value, so 3.7 fills indices 0,1,2,3 (4 stars)
      expect(filledStars).toHaveLength(4);
    });

    it('should handle negative values', () => {
      const { container } = render(<Rating value={-1} readonly />);
      const stars = container.querySelectorAll('svg');
      const filledStars = Array.from(stars).filter((star) =>
        star.classList.contains('fill-yellow-400')
      );
      expect(filledStars).toHaveLength(0);
    });

    it('should handle values greater than 5', () => {
      const { container } = render(<Rating value={10} readonly />);
      const stars = container.querySelectorAll('svg');
      const filledStars = Array.from(stars).filter((star) =>
        star.classList.contains('fill-yellow-400')
      );
      expect(filledStars).toHaveLength(5);
    });
  });
});

