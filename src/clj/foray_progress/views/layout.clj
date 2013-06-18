(ns clj.foray-progress.views.layout
  (:use [hiccup.core :only (html)]
        [hiccup.page :only (html5 include-css include-js)]))

(defn common [title & body]
  (html5
    [:head
      [:meta {:charset "utf-8"}]
      [:meta {:http-equiv "X-UA-Compatible" :content "IE=edge,chrome=1"}]
      [:meta {:name "viewport" :content "width=device-width, initial-scale=1, maximum-scale=1"}]
      [:title title]
  (include-css "/css/bootstrap.min.css")]
  [:body
    [:div {:id "header"}
      [:h1 {:class "container"} "Foray Progress"]]
    [:div {:id "content" :class "container"} body]
    (include-js "http://code.jquery.com/jquery-1.10.0.min.js")
    (include-js "/js/bootstrap.min.js")
   ]))

(defn four-oh-four []
  (common "Page Not Found"
          [:div {:id "four-oh-four"}
          "The page you requested could not be found"]))
