import { useEffect, useRef } from 'react';

const OtpInput = ({ value = '', onChange, length = 6, autoFocus = true, disabled = false }) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (index, char) => {
    if (!/^\d?$/.test(char)) return;
    const chars = value.split('');
    while (chars.length < length) chars.push('');
    chars[index] = char;
    const nextValue = chars.join('');
    onChange(nextValue);

    if (char && index < length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const chars = Array.from({ length }, (_, i) => pasted[i] || '');
    onChange(chars.join(''));
    inputsRef.current[Math.min(pasted.length - 1, length - 1)]?.focus();
  };

  const chars = Array.from({ length }, (_, i) => value[i] || '');

  return (
    <div className="flex justify-center gap-3 scale-80 md:scale-100" onPaste={handlePaste}>
      {chars.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 h-16 text-center text-2xl border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-blue-400 transition-transform duration-150 hover:scale-105"
        />
      ))}
    </div>
  );
};

export default OtpInput;