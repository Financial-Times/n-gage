# n-gage

<img src="https://media.giphy.com/media/LTPvh458Wx0BO/giphy.gif" align="right" />

Make it so next - an experiment to provide next with a self-updating makefile (with thanks to Matt Brennan for the idea).

## Migrating from n.Makefile to n-gage

https://github.com/Financial-Times/n-gage/wiki/Migrating-from-n.Makefile-to-n-gage

## Differences from n-makefile

- `_deploy_apex` task removed, i.e. does not include any lambda tooling. If you need to use the old tool simply copy from your old n.Makefile
- `n-gage` includes [`secret-squirrel`](https://github.com/Financial-Times/secret-squirrel/blob/master/README.md#secret-squirrel).
