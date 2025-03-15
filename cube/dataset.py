from tqdm import tqdm
import torch
from cube import Cube, get_reverse_move
from train import get_state, check_for_reversal, SCRAMBLE_SIZE

def make_dataset(size:int=50000) -> None:
  for i in range(10):
    states = []
    moves = []
    for _ in tqdm(range(size)):
      cube = Cube()

      while 1:
        scramble = torch.randint(0, 12, (SCRAMBLE_SIZE,))
        if not check_for_reversal(scramble):
          break

      for m in scramble:
        cube.move(m)
        states.append(get_state(cube))
        moves.append(get_reverse_move(m))
    
    with open(f'data/states{i}.pt', 'wb') as f:
      torch.save(torch.stack(states), f)

    with open(f'data/moves{i}.pt', 'wb') as f:
      torch.save(torch.stack(moves), f)

if __name__ == '__main__':
  make_dataset()
