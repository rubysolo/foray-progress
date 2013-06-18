(ns clj.foray-progress.core
  (:use [compojure.core :only (defroutes)]
        [ring.adapter.jetty :as ring])
  (:require [compojure.route :as route]
            [compojure.handler :as handler]
            [clj.foray-progress.controllers :as progress]
            [clj.foray-progress.views.layout :as layout]))

(defroutes routes
  progress/routes
  (route/resources "/")
  (route/not-found (layout/four-oh-four)))

(def application (handler/site routes))

(defn start [port]
  (run-jetty application {:port port :join? false}))

(defn -main []
  (let [port (Integer/parseInt
               (or (System/getenv "PORT") "8888"))]
    (start port)))

