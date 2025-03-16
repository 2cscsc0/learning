from __future__ import annotations
import numpy as np
import numpy.typing as npt

from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

def get_reverse_move(move: int) -> int:
  return (move + 1) if move % 2 == 0 else (move - 1)

class Face:
  UP   : int = 0
  DOWN : int = 1
  LEFT : int = 2
  RIGHT: int = 3
  FRONT: int = 4
  BACK : int = 5

class Move:
  R  = 0
  R_ = 1

  L  = 2
  L_ = 3

  F  = 4
  F_ = 5

  B  = 6
  B_ = 7

  U  = 8
  U_ = 9

  D  = 10
  D_ = 11
  
  M  = 12
  M_ = 13

class Cube:
  def __init__(self) -> None:
    self.faces: list[npt.NDArray] = [
      np.full(fill_value=0, shape=(3,3), dtype=np.int8), # up
      np.full(fill_value=1, shape=(3,3), dtype=np.int8), # down
      np.full(fill_value=2, shape=(3,3), dtype=np.int8), # left
      np.full(fill_value=3, shape=(3,3), dtype=np.int8), # right
      np.full(fill_value=4, shape=(3,3), dtype=np.int8), # front
      np.full(fill_value=5, shape=(3,3), dtype=np.int8), # back
    ]
    self.moves: list[int] = []
    self.fig = None
    self.ax = None
  
  def __getitem__(self, face: int) -> npt.NDArray:
    return self.faces[face]

  def __setitem__(self, face: int, value: npt.NDArray) -> None:
    self.faces[face] = value
  
  def __repr__(self) -> str:
    return (
      f"Face.UP:\n  {self[0][0]}\n  {self[0][1]}\n  {self[0][2]}\n"
      f"Face.DOWN:\n  {self[1][0]}\n  {self[1][1]}\n  {self[1][2]}\n"
      f"Face.LEFT:\n  {self[2][0]}\n  {self[2][1]}\n  {self[2][2]}\n"
      f"Face.RIGHT:\n  {self[3][0]}\n  {self[3][1]}\n  {self[3][2]}\n"
      f"Face.FRONT:\n  {self[4][0]}\n  {self[4][1]}\n  {self[4][2]}\n"
      f"Face.BACK:\n  {self[5][0]}\n  {self[5][1]}\n  {self[5][2]}\n"
    )

  def copy(self) -> Cube:
    cube = Cube()
    cube.faces = [np.copy(face) for face in self.faces]
    cube.moves = self.moves.copy()
    return cube
 
  def move(self, move: Move) -> None:
    _faces = [
      np.copy(self.faces[Face.UP]),
      np.copy(self.faces[Face.DOWN]),
      np.copy(self.faces[Face.LEFT]),
      np.copy(self.faces[Face.RIGHT]),
      np.copy(self.faces[Face.FRONT]),
      np.copy(self.faces[Face.BACK]),
    ]
    match(move):
      case Move.R:
        self[Face.UP][:,2] = _faces[Face.FRONT][:,2]
        self[Face.DOWN][:,2] = _faces[Face.BACK][:,2]
        # self[Face.LEFT] = self[Face.LEFT]
        self[Face.RIGHT] = np.rot90(_faces[Face.RIGHT], k=1)
        self[Face.FRONT][:,2] = _faces[Face.DOWN][:,2]
        self[Face.BACK][:,2] = _faces[Face.UP][:,2]
      case Move.R_:
        self[Face.UP][:,2] = _faces[Face.BACK][:,2]
        self[Face.DOWN][:,2] = _faces[Face.FRONT][:,2]
        # self[Face.LEFT] = self[Face.LEFT]
        self[Face.RIGHT] = np.rot90(_faces[Face.RIGHT], k=3)
        self[Face.FRONT][:,2] = _faces[Face.UP][:,2]
        self[Face.BACK][:,2] = _faces[Face.DOWN][:,2]
      case Move.L:
        self[Face.UP][:,0] = _faces[Face.BACK][:,0]
        self[Face.DOWN][:,0] = _faces[Face.FRONT][:,0]
        self[Face.LEFT] = np.rot90(_faces[Face.LEFT], k=1)
        # self[Face.RIGHT] = self[Face.RIGHT]
        self[Face.FRONT][:,0] = _faces[Face.UP][:,0]
        self[Face.BACK][:,0] = _faces[Face.DOWN][:,0]
      case Move.L_:
        self[Face.UP][:,0] = _faces[Face.FRONT][:,0]
        self[Face.DOWN][:,0] = _faces[Face.BACK][:,0]
        self[Face.LEFT] = np.rot90(_faces[Face.LEFT], k=3)
        # self[Face.RIGHT] = self[Face.RIGHT]
        self[Face.FRONT][:,0] = _faces[Face.DOWN][:,0]
        self[Face.BACK][:,0] = _faces[Face.UP][:,0]
      case Move.F:
        self[Face.UP][0,:] = _faces[Face.LEFT][:,2]
        self[Face.DOWN][2,:] = _faces[Face.RIGHT][:,0]
        self[Face.LEFT][:,2] = _faces[Face.DOWN][2,:][::-1]
        self[Face.RIGHT][:,0] = _faces[Face.UP][0,:][::-1]
        self[Face.FRONT] = np.rot90(_faces[Face.FRONT], k=1)
        # self[Face.BACK] = self[Face.BACK]
      case Move.F_:
        self[Face.UP][0,:] = _faces[Face.RIGHT][:,0][::-1]
        self[Face.DOWN][2,:] = _faces[Face.LEFT][:,2][::-1]
        self[Face.LEFT][:,2] = _faces[Face.UP][0,:]
        self[Face.RIGHT][:,0] = _faces[Face.DOWN][2,:]
        self[Face.FRONT] = np.rot90(_faces[Face.FRONT], k=3)
        # self[Face.BACK] = self[Face.BACK]
      case Move.B:
        self[Face.UP][2,:] = _faces[Face.RIGHT][:,2][::-1]
        self[Face.DOWN][0,:] = _faces[Face.LEFT][:,0][::-1]
        self[Face.LEFT][:,0] = _faces[Face.UP][2,:]
        self[Face.RIGHT][:,2] = _faces[Face.DOWN][0,:]
        #self[Face.FRONT] = _faces[Face.FRONT]
        self[Face.BACK] = np.rot90(_faces[Face.BACK], k=1)
      case Move.B_:
        self[Face.UP][2,:] = _faces[Face.LEFT][:,0]
        self[Face.DOWN][0,:] = _faces[Face.RIGHT][:,2]
        self[Face.LEFT][:,0] = _faces[Face.DOWN][0,:][::-1]
        self[Face.RIGHT][:,2] = _faces[Face.UP][2,:][::-1]
        # self[Face.FRONT] = _faces[Face.FRONT]
        self[Face.BACK] = np.rot90(_faces[Face.BACK], k=3)
      case Move.U:
        self[Face.UP] = np.rot90(_faces[Face.UP], k=1)
        # self[Face.DOWN] = self[Face.DOWN]
        self[Face.LEFT][2,:] = _faces[Face.FRONT][2,:]
        self[Face.RIGHT][2,:] = _faces[Face.BACK][0,:][::-1]
        self[Face.FRONT][2,:] = _faces[Face.RIGHT][2,:]
        self[Face.BACK][0,:] = _faces[Face.LEFT][2,:][::-1]
      case Move.U_:
        self[Face.UP] = np.rot90(_faces[Face.UP], k=3)
        # self[Face.DOWN] = self[Face.DOWN]
        self[Face.LEFT][2,:] = _faces[Face.BACK][0,:][::-1]
        self[Face.RIGHT][2,:] = _faces[Face.FRONT][2,:]
        self[Face.FRONT][2,:] = _faces[Face.LEFT][2,:]
        self[Face.BACK][0,:] = _faces[Face.RIGHT][2,:][::-1]
      case Move.D:
        # self[Face.UP] = self[Face.UP]
        self[Face.DOWN] = np.rot90(_faces[Face.DOWN], k=1)
        self[Face.LEFT][0,:] = _faces[Face.BACK][2,:][::-1]
        self[Face.RIGHT][0,:] = _faces[Face.FRONT][0,:]
        self[Face.FRONT][0,:] = _faces[Face.LEFT][0,:]
        self[Face.BACK][2,:] = _faces[Face.RIGHT][0,:][::-1]
      case Move.D_:
        # self[Face.UP] = self[Face.UP]
        self[Face.DOWN] = np.rot90(_faces[Face.DOWN], k=3)
        self[Face.LEFT][0,:] = _faces[Face.FRONT][0,:]
        self[Face.RIGHT][0,:] = _faces[Face.BACK][2,:][::-1]
        self[Face.FRONT][0,:] = _faces[Face.RIGHT][0,:]
        self[Face.BACK][2,:] = _faces[Face.LEFT][0,:][::-1]
      case Move.M:
        self[Face.UP][:, 1] = _faces[Face.BACK][:, 1]
        self[Face.DOWN][:, 1] = _faces[Face.FRONT][:, 1]
        # self[Face.LEFT] = self[Face.LEFT]
        # self[Face.RIGHT] = self[Face.RIGHT]
        self[Face.FRONT][:, 1] = _faces[Face.UP][:, 1]
        self[Face.BACK][:, 1] = _faces[Face.DOWN][:, 1]
      case Move.M_:
        self[Face.UP][:, 1] = _faces[Face.FRONT][:, 1]
        self[Face.DOWN][:, 1] = _faces[Face.BACK][:, 1]
        # self[Face.LEFT] = self[Face.LEFT]
        # self[Face.RIGHT] = self[Face.RIGHT]
        self[Face.FRONT][:, 1] = _faces[Face.DOWN][:, 1]
        self[Face.BACK][:, 1] = _faces[Face.UP][:, 1]
    self.moves.append(move)
    
    if hasattr(self, 'fig') and self.fig is not None:
        self.update_visualization()
  
  def scramble(self, scramble: list[int]) -> None:
    for move in scramble:
      self.move(move)
    self.moves.append([-1])
  
  def solved(self) -> bool:
    if (
      np.all(self.faces[Face.UP] == 0)
      and np.all(self.faces[Face.DOWN] == 1)
      and np.all(self.faces[Face.LEFT] == 2)
      and np.all(self.faces[Face.RIGHT] == 3)
      and np.all(self.faces[Face.FRONT] == 4)
      and np.all(self.faces[Face.BACK] == 5)
    ):
      return True
    return False
  
  def reset(self) -> None:
    self.faces: list[npt.NDArray] = [
      np.full(fill_value=0, shape=(3,3), dtype=np.int8), # up
      np.full(fill_value=1, shape=(3,3), dtype=np.int8), # down
      np.full(fill_value=2, shape=(3,3), dtype=np.int8), # left
      np.full(fill_value=3, shape=(3,3), dtype=np.int8), # right
      np.full(fill_value=4, shape=(3,3), dtype=np.int8), # front
      np.full(fill_value=5, shape=(3,3), dtype=np.int8), # back
    ]
    self.moves = []
    
    # Update visualization if active
    if hasattr(self, 'fig') and self.fig is not None:
        self.update_visualization()

  def undo(self) -> None:
    if len(self.moves) == 0: return
    self.move(get_reverse_move(self.moves.pop()))
    self.moves.pop()
  
  def draw_single_face(self, ax, origin: tuple[int, int], face_color: str, face: int):
    match face:
      case Face.UP:
        x, y = origin
        z = 3
      case Face.DOWN:
        x, y = origin
        z = 0
      case Face.LEFT:
        y, z = origin
        x = 0
      case Face.RIGHT:
        y, z = origin
        x = 3
      case Face.FRONT:
        x, z = origin
        y = 0
      case Face.BACK:
        x, z = origin
        y = 3

    match face:
      case Face.UP | Face.DOWN:
        vertices = [[[x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z]]]
      case Face.FRONT | Face.BACK:
        vertices = [[[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]]]
      case Face.LEFT | Face.RIGHT:
        vertices = [[[x, y, z], [x, y + 1, z], [x, y + 1, z + 1], [x, y, z + 1]]]
      
    ax.add_collection3d(Poly3DCollection(vertices, facecolors=face_color, edgecolors='black'))
  
  def update_visualization(self):
    """Update the visualization with current cube state"""
    if self.fig is None or self.ax is None:
        return
        
    # Clear current plot
    self.ax.clear()
    
    colors = {
      0: 'white',
      1: 'yellow',
      2: 'red',
      3: 'orange',
      4: 'blue',
      5: 'green',
    }

    _faces = [
      np.copy(self.faces[Face.UP].T),
      np.flip(np.copy(self.faces[Face.DOWN].T), axis=1),
      np.flip(np.copy(self.faces[Face.LEFT].T), axis=0),
      np.copy(self.faces[Face.RIGHT].T),
      np.copy(self.faces[Face.FRONT].T),
      np.flip(np.copy(self.faces[Face.BACK].T), axis=1),
    ]

    for F in range(6):
      for x in range(3):
        for y in range(3):
          self.draw_single_face(self.ax, (x, y), colors[_faces[F][x, y]], F)

    self.ax.set_xlim([0, 3])
    self.ax.set_ylim([0, 3])
    self.ax.set_zlim([0, 3])
    self.ax.set_xticks([])
    self.ax.set_yticks([])
    self.ax.set_zticks([])
    
    self.fig.canvas.draw_idle()
    plt.pause(0.001)
  
  def show(self) -> None:
    """Display the cube in a non-blocking window that updates with moves"""
    if not hasattr(self, 'fig') or self.fig is None or not plt.fignum_exists(self.fig.number):
        self.fig = plt.figure(figsize=(8, 8))
        self.ax = self.fig.add_subplot(111, projection='3d')
        self.ax.set_box_aspect([1, 1, 1])
        
        if not plt.isinteractive():
            plt.ion()
    
    self.update_visualization()
    
    self.fig.canvas.draw()
    plt.show(block=False)
