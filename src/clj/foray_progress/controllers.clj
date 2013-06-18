(ns clj.foray-progress.controllers
  (:use [compojure.core :only (defroutes GET POST)])
  (:require [clojure.string :as str]
            [ring.util.response :as ring]
            [clj.foray-progress.views.progress :as view]
            [clj.foray-progress.models.progress :as model]))

(defn index []
  (view/index (model/summary)))

(defn create [progress]
  (when-not (or (str/blank? (:chapter progress))
                (str/blank? (:username progress)))
    (model/store progress))
  (ring/redirect "/"))

(defroutes routes
  (GET  "/" [] (index))
  (POST "/" {params :params} (create params)))
