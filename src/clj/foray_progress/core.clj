(ns clj.foray-progress.core
  (:use [compojure.core :only (defroutes GET)]
        [ring.adapter.jetty :as ring]
        [hiccup.page :only (html5)]))

(defn index []
  (html5
    [:head
      [:title "Hello World"]]
    [:body
      [:div { :id "content" } "Hello World"]]))

(defroutes routes
  (GET "/" [] (index)))

(defn -main []
  (run-jetty routes {:port 8888 :join? false}))

