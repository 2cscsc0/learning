import torch
from torch import nn
from torch.optim import Adam 
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm
from cube import Cube, get_reverse_move
import random
import os

DEVICE = 'mps' if torch.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'

class CubeDataSet(Dataset):
  def __init__(self, states, moves) -> None:
    self.states = states
    self.moves = moves
  
  def __len__(self):
    return len(self.states)
  
  def __getitem__(self, idx):
    return self.states[idx], self.moves[idx]

class CubeNet(nn.Module):
  def __init__(self, ) -> None:
    super().__init__()
    hidden = 1024
    self.linear_relu_stack = nn.Sequential(
      nn.Linear(324, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),

      *([
        nn.Linear(hidden, hidden),
        nn.ReLU(),
        nn.BatchNorm1d(hidden),
      ] * 2),

      nn.Linear(hidden, 12),
    )

  def forward(self, x: torch.Tensor) -> torch.Tensor:
    return self.linear_relu_stack(x)

def get_state(cube: Cube) -> torch.Tensor:
  state = torch.zeros(6, 6, 3, 3)
  for face in range(6):
    for i in range(3):
      for j in range(3):
        color = cube.faces[face][i, j]
        state[face, color, i, i] = 1
  return state.flatten()

def check_for_reversal(scramble: list[int]) -> bool:
  for i in range(len(scramble) - 1):
    if scramble[i] == get_reverse_move(scramble[i + 1]):
      return True
  return False

def get_loader(size:int=1000, batch_size:int=512, saves:list[tuple[str]]=None) -> tuple[torch.Tensor, torch.Tensor]:
  if saves is not None:
    print("Loading from saves")
    files = saves.pop()
    states = torch.load(files[0], weights_only=True)
    moves = torch.load(files[1], weights_only=True)
    dataset = CubeDataSet(states, moves)
    return DataLoader(dataset, batch_size=batch_size)

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
  dataset = CubeDataSet(torch.stack(states), torch.stack(moves))
  #X = torch.stack(states)
  #Y = torch.stack(moves)
  return DataLoader(dataset, batch_size=batch_size, shuffle=True)

def train(model, criterion, optimizer, device, data):
  model.train()

  for X, Y in (t:=tqdm(get_loader(saves=data))):
    X, Y = X.to(device), Y.to(device)
    optimizer.zero_grad()

    output = model(X)
    loss = criterion(output, Y)
    loss.backward()
    optimizer.step()

    if t.n % 100 == 0: t.set_description(f"loss: {loss.item():.4f}")

def test(model, device):
  model.eval()
  correct = 0
  total = 0
  
  with torch.no_grad():
    for X, Y in (t:=tqdm(get_loader(1000, 32))):
      X, Y = X.to(device), Y.to(device)
      outputs = model(X)
      total += Y.size(0)
      correct += (outputs.argmax(dim=1) == Y).sum().item()

      if t.n % 100 == 0: t.set_description(f"accuracy: {100 * correct / total:.2f}%")

SCRAMBLE_SIZE = 26

def main() -> None:
  model = CubeNet().to(DEVICE)
  criterion = nn.CrossEntropyLoss()
  optimizer = Adam(model.parameters(), lr=1e-3)

  epochs = 20

  data = [(f'data/states{i}.pt', f'data/moves{i}.pt') for i in range(epochs)]

  import time
  t = time.time()


  for epoch in range(epochs):
    train(model, criterion, optimizer, DEVICE, data)
    torch.save(model.state_dict(), f'models/{t}-cube-{epoch}.pth')

  test(model, DEVICE)

if __name__ == "__main__":
  main()
