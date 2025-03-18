import { FaArrowCircleDown } from 'react-icons/fa';

interface ScrollToBottomProps {
  onClick: () => void;
  isVisible: boolean;
}

export default function ScrollToBottom({ onClick, isVisible }: ScrollToBottomProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-[180px] right-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 z-50 cursor-pointer"
      aria-label="Scroll to bottom"
    >
      <FaArrowCircleDown size={24} />
    </button>
  );
}
