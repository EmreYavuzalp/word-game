import { createRouter, createWebHistory } from "vue-router";
import Games from "../components/Games.vue";
import Game from "../components/SingleGame.vue";
import CreateGame from "../components/CreateGame.vue";
import JoinGame from "../components/JoinGame.vue";

const routes = [
  {
    path: "/",
    name: "Games",
    component: Games,
  },
  {
    path: "/game/:gameId",
    name: "Game",
    component: Game,
    props: (route) => ({
      gameId: route.params.gameId,
      playerName: route.query.playerName || "Guest",
    }),
  },
  {
    path: "/create-game",
    name: "CreateGame",
    component: CreateGame,
    props: (route) => ({
      gameId: route.query.gameId || null,
      playerName: route.query.playerName || "Anonymous",
    }),
  },
  {
    path: "/join-game",
    name: "JoinGame",
    component: JoinGame,
    props: (route) => ({
      gameId: route.query.gameId || null,
      playerName: route.query.playerName || "Anonymous",
    }),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
