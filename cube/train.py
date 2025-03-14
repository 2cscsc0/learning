import torch
from torch import nn
from torch.optim import Adam 
from tqdm import tqdm
from cube import Cube, get_reverse_move
import random
import os

DEVICE = 'mps' if torch.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'

class CubeNet(nn.Module):
  def __init__(self, ) -> None:
    super().__init__()
    hidden = 2048
    self.linear_relu_stack = nn.Sequential(
      nn.Linear(324, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.BatchNorm1d(hidden),
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

def get_loader() -> torch.utils.data.DataLoader:
  if os.path.exists("data/cube_states.pt") and os.path.exists("data/cube_moves.pt"):
    with open("data/cube_states.pt", "rb") as f:
      X = torch.load(f)
    with open("data/cube_moves.pt", "rb") as f:
      Y = torch.load(f)
    return torch.utils.data.DataLoader(torch.utils.data.TensorDataset(X, Y), batch_size=SCRAMBLE_SIZE * 100, shuffle=True)

  states = []
  moves = []
  for _ in tqdm(range(50000)):
    cube = Cube()

    while 1:
      scramble = torch.randint(0, 12, (SCRAMBLE_SIZE,))
      if not check_for_reversal(scramble):
        break

    for m in scramble:
      cube.move(m)
      states.append(get_state(cube))
      moves.append(get_reverse_move(m))

  X = torch.stack(states)
  Y = torch.stack(moves)

  with open("data/cube_states.pt", "wb") as f:
    torch.save(X, f)
  with open("data/cube_moves.pt", "wb") as f:
    torch.save(Y, f)

  return torch.utils.data.DataLoader(torch.utils.data.TensorDataset(X, Y), batch_size=SCRAMBLE_SIZE * 100, shuffle=True)

def train(model, train_loader, criterion, optimizer, device):
  model.train()

  for X, Y in (t:=tqdm(train_loader)):
    X, Y = X.to(device), Y.to(device)
    optimizer.zero_grad()

    output = model(X)
    loss = criterion(output, Y)
    loss.backward()
    optimizer.step()

    if t.n % 100 == 0: t.set_description(f"loss: {loss.item():.4f}")

def test(model, test_loader, device):
  model.eval()
  correct = 0
  total = 0
  
  with torch.no_grad():
    for X, Y in (t:=tqdm(test_loader)):
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

  epochs = 10
  loader = get_loader()
  for epoch in range(epochs):
    train(model, loader, criterion, optimizer, DEVICE)

  test(model, loader, DEVICE)

  cube = Cube()

  import time

  for _ in range(1):
    cube.reset()

    while 1:
      scramble = [random.randint(0, 12) for _ in range(SCRAMBLE_SIZE)]
      if not check_for_reversal(scramble):
        break
    cube.scramble(scramble)

    for move in scramble[::-1]:
      cube.move(model(get_state(cube).unsqueeze(0).to(DEVICE)).argmax().item())
      cube.show()
      time.sleep(0.5)

  torch.save(model.state_dict(), f'models/cube{time.time()}.pth')

if __name__ == "__main__":
  main()
