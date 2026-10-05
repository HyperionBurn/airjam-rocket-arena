/*
 * Arcade client: the whole adapter contract for a game that is not written in
 * TypeScript or React. Load it from the hub (`<script src="https://HUB/arcade-client.js">`)
 * or copy it next to the game; it has no dependencies.
 *
 *   var arcade = ArcadeClient.fromUrl();          // null when the game was opened on its own
 *   if (arcade) {
 *     arcade.players;                             // [{ id, name, color }]: skip your own lobby, these are your players
 *     arcade.ready(controllerUrlTemplate);        // template uses {playerId} {name} {color}; null if phones need no page of yours
 *     arcade.progress({ [playerId]: score });     // optional live scores for the hub's HUD
 *     arcade.result(placements);                  // [{ playerId, rank, score? }], rank 1 = first, equal ranks tie, null = did not finish
 *   }
 *
 * `ArcadeClient.rank(players, scores, { lowerIsBetter })` turns a score table into placements.
 * The hub tears the game down once a result arrives, so there is no "exit" call.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ArcadeClient = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function decodePlayers(value) {
    if (!value) return [];
    try {
      var b64 = value.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var json = decodeURIComponent(
        Array.prototype.map
          .call(atob(b64), function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );
      var list = JSON.parse(json);
      return Array.isArray(list)
        ? list
            .filter(function (p) {
              return p && typeof p.id === "string" && p.id;
            })
            .map(function (p) {
              return { id: p.id, name: typeof p.name === "string" && p.name.trim() ? p.name.trim() : "Player", color: p.color };
            })
        : [];
    } catch (e) {
      return [];
    }
  }

  /** Placements from scores. Equal scores share a rank; players without a score did not finish. */
  function rank(players, scores, options) {
    var lower = !!(options && options.lowerIsBetter);
    var finished = players.filter(function (p) {
      return typeof scores[p.id] === "number" && isFinite(scores[p.id]);
    });
    var values = finished
      .map(function (p) {
        return scores[p.id];
      })
      .sort(function (a, b) {
        return lower ? a - b : b - a;
      });
    return players.map(function (p) {
      var score = scores[p.id];
      if (typeof score !== "number" || !isFinite(score)) return { playerId: p.id, rank: null };
      return { playerId: p.id, rank: values.indexOf(score) + 1, score: score };
    });
  }

  function fromUrl(search) {
    var params = new URLSearchParams(search === undefined ? location.search : search);
    var origin = params.get("arcade");
    var round = params.get("round");
    var token = params.get("token");
    if (!origin || !round || !token || !/^https?:\/\//i.test(origin)) return null;
    origin = origin.replace(/\/+$/, "");
    function post(path, body) {
      return fetch(origin + "/api/rounds/" + round + "/" + path, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify(body),
        keepalive: true,
      }).then(
        function (r) {
          return r.ok;
        },
        function () {
          return false;
        },
      );
    }
    return {
      origin: origin,
      session: params.get("session"),
      round: round,
      players: decodePlayers(params.get("players")),
      ready: function (controllerUrl) {
        return post("ready", { controllerUrl: controllerUrl === undefined ? null : controllerUrl });
      },
      progress: function (scores) {
        return post("progress", { scores: scores });
      },
      result: function (placements) {
        return post("result", { placements: placements });
      },
    };
  }

  return { fromUrl: fromUrl, decodePlayers: decodePlayers, rank: rank };
});
