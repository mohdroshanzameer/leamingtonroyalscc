import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export default function KeyboardShortcuts({ 
  onRun, 
  onWicket, 
  onWide, 
  onNoBall, 
  onUndo, 
  onSwap,
  disabled 
}) {
  const handleKeyPress = useCallback((e) => {
    if (disabled) return;
    
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        onRun(parseInt(e.key));
        break;
      case 'w':
      case 'W':
        onWicket();
        break;
      case 'e':
      case 'E':
        onWide();
        break;
      case 'n':
      case 'N':
        onNoBall();
        break;
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onUndo();
        }
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          onSwap();
        }
        break;
      case '?':
        toast.info(
          <div className="text-xs space-y-1">
            <p className="font-bold mb-2">Keyboard Shortcuts</p>
            <p>0-6: Score runs</p>
            <p>W: Wicket</p>
            <p>E: Wide</p>
            <p>N: No Ball</p>
            <p>S: Swap batsmen</p>
            <p>Ctrl+Z: Undo</p>
          </div>,
          { duration: 5000 }
        );
        break;
      default:
        break;
    }
  }, [onRun, onWicket, onWide, onNoBall, onUndo, onSwap, disabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return null; // This is a utility component, no UI
}