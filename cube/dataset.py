from tqdm import tqdm
import torch
from cube import Cube, get_reverse_move
from train import get_state, check_for_reversal, SCRAMBLE_SIZE
import multiprocessing as mp

def make_dataset(i: int, size: int) -> None:
  states = []
  moves = []
  for j in range(size):
    cube = Cube()

    while 1:
      scramble = torch.randint(0, 12, (SCRAMBLE_SIZE,))
      if not check_for_reversal(scramble):
        break

    for m in scramble:
      cube.move(m)
      states.append(get_state(cube))
      moves.append(get_reverse_move(m))

    if j % 10000 == 0: print(f"Worker {i}: {j}/{size}")
  
  with open(f'data/states{i}.pt', 'wb') as f:
    torch.save(torch.stack(states), f)

  with open(f'data/moves{i}.pt', 'wb') as f:
    torch.save(torch.stack(moves), f)

def datasets(size:int=50000) -> None:
  indices = list(range(7, 20))
  workers = 5

  with mp.Pool(workers) as pool:
    pool.starmap(make_dataset, [(i, size) for i in indices])

if __name__ == '__main__':
  datasets()
