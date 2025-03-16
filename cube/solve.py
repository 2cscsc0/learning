from cube import Cube, Move, get_reverse_move
from train import CubeNet, check_for_reversal
from pathlib import Path
import torch
from train import get_state, DEVICE

def load_model(path: Path) -> CubeNet:
  model = CubeNet()
  model.load_state_dict(torch.load(path, weights_only=True))
  return model

def search(model, cube, depth, max_width=512) -> list[Move]:
  top_moves = 3
  tree = []
  runs = 1
  for i in range(depth):
    acc = []
    for r in range(min(runs, max_width)):
      prev_prob = 0
      prev_moves = []

      if i > 0:
        prev_moves = tree[0][r][0]
        for mv in prev_moves: cube.move(mv)
        prev_prob = tree[0][r][1]

      if cube.solved(): return prev_moves

      pred = model(get_state(cube).unsqueeze(0).to(DEVICE)).squeeze().topk(top_moves)
      for m, p in zip(pred.indices, pred.values):
        acc.append((prev_moves + [m.item()], p.item() + prev_prob))
      
      if i > 0:
        for _ in prev_moves: cube.undo()

      runs *= top_moves
      tree.clear()
      tree.append(acc)

      tree[0].sort(key=lambda x: x[1], reverse=True)
      tree[0] = tree[0][:max_width]
  return tree[0][0][0]

def solve() -> None:
  cube = Cube()
  model = load_model(Path("models/model.pth"))
  model.to(DEVICE)
  model.eval()

  SCRAMBLE_SIZE = 26
  
  while 1:
    scramble = torch.randint(0, 12, (SCRAMBLE_SIZE,))
    if not check_for_reversal(scramble):
      break
  
  cube.scramble(scramble)
  print(f"Scramble         : {scramble.tolist()}")
  print(f"Possible solution: {[get_reverse_move(m.item()) for m in scramble][::-1]}")

  solution = search(model, cube.copy(), SCRAMBLE_SIZE, 1024)

  print(f"Solution         : {solution}")

  print(f"Cube solved      : {cube.solved()}")
  cube.scramble(solution)
  cube.show()

if __name__ == "__main__":
  solve()
