"use client";

import { useState, useRef, useEffect } from "react";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import { FaSmile, FaPaperPlane } from 'react-icons/fa';

interface ChatInputProps {
  channel: any;
  inputMessage: string;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  scrollToBottom: (smooth?: boolean) => void;
  onInputChange: (value: string) => void;
}

export default function ChatInput({
  channel,
  inputMessage,
  handleKeyDown,
  handleSendMessage,
  scrollToBottom,
  onInputChange,
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';

      // Calculate new height (min 40px, max 200px)
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 200);

      // Apply new height
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputMessage]);

  const onEmojiClick = (emojiObject: any) => {
    onInputChange(inputMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              className="w-full bg-gray-700 text-white rounded-lg pl-4 pr-12 py-2.5 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[200px] leading-relaxed"
              placeholder={`Type a message in ${channel.name}...`}
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-600"
              type="button"
              aria-label="Add emoji"
            >
              <FaSmile size={20} />
            </button>
          </div>
          <button
            onClick={() => {
              handleSendMessage();
              scrollToBottom(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center min-w-[40px] h-[40px] self-center"
            aria-label="Send message"
            type="button"
          >
            <FaPaperPlane size={18} />
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-4 mb-2">
            <div className="bg-gray-800 rounded-lg shadow-lg p-2">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width={320}
                height={400}
                theme={Theme.DARK}
                searchPlaceholder="Search emoji..."
                previewConfig={{
                  showPreview: false
                }}
                skinTonesDisabled
                lazyLoadEmojis
                emojiStyle={EmojiStyle.NATIVE}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
