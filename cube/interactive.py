from cube import Cube, Move
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import random
from train import check_for_reversal

def on_key(event):
  if event.key == 'r':
    cube.move(Move.R)
    return False
  elif event.key == 'R':  # Shift+r
    cube.move(Move.R_)
    return False
  elif event.key == 'l':
    cube.move(Move.L)
    return False
  elif event.key == 'L':  # Shift+l
    cube.move(Move.L_)
    return False
  elif event.key == 'u':
    cube.move(Move.U)
    return False
  elif event.key == 'U':  # Shift+u
    cube.move(Move.U_)
    return False
  elif event.key == 'd':
    cube.move(Move.D)
    return False
  elif event.key == 'D':  # Shift+d
    cube.move(Move.D_)
    return False
  elif event.key == 'f':
    cube.move(Move.F)
    return False
  elif event.key == 'F':  # Shift+f
    cube.move(Move.F_)
    return False
  elif event.key == 'b':
    cube.move(Move.B)
    return False
  elif event.key == 'B':  # Shift+b
    cube.move(Move.B_)
    return False
  elif event.key == 's':
    while 1:
      scramble = [random.randint(0, 12) for _ in range(20)]
      if not check_for_reversal(scramble):
        break
    cube.scramble(scramble)
  elif event.key == 'escape':
    plt.close()
    return False

def main() -> None:
  global cube
  cube = Cube()
  
  # Show the cube
  cube.show()
  
  if cube.fig is not None:
    plt.rcParams['keymap.fullscreen'] = []
    plt.rcParams['keymap.home'] = ["m"]
    plt.rcParams['keymap.back'] = []
    plt.rcParams['keymap.forward'] = []
    plt.rcParams['keymap.save'] = []
    
    cube.fig.canvas.mpl_connect('key_press_event', on_key)
    
    print("Keyboard controls:")
    print("  R, L, U, D, F, B: Regular moves")
    print("  Shift+R/L/U/D/F/B: Reverse moves")
    print("  Esc: Close the window")
    
    plt.show(block=True)


if __name__ == "__main__":
  main()
