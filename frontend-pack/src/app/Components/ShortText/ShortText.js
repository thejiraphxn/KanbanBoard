export default function ShortText(char, value) {
    if (typeof char !== 'string') {
      throw new TypeError('Input must be a string');
    }
  
    // Escape backslashes before checking length
    const escapedString = char.replace('\\', '\\\\');
  
    if (escapedString.length <= value) {
      return char;
    } else {
      return escapedString.substring(0, value) + '...';
    }
}