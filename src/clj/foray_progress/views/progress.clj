(ns clj.foray-progress.views.progress
  (:use [hiccup.core :only (h)]
        [hiccup.form :only (form-to label text-field radio-button submit-button)])
  (:require [clj.foray-progress.views.layout :as layout]))

(defn progress-form []
  [:div {:id "progress-form" :class "sixteen columns alpha omega"}
    (form-to [:post "/"]
      (label "progress" "Where are you in Joy of Clojure?")
      [:br]
      (label "username" "Username:")
      (text-field "username")
      (for [chapter (range 1 13)]
        [:div (radio-button "chapter" false chapter)
              (str "Chapter " chapter)])
      (submit-button "Save"))])

(defn display-progress [summary]
  (locking System/out (println summary))
  [:table {:id "summary"}
    [:thead
      [:tr
        [:th "Chapter"]
        [:th "Count"]]]
    [:tbody
      (map (fn [row]
        [:tr
          [:td (:chapter row)]
          [:td (:count row)]]) summary)]])

(defn index [summary]
  (layout/common "PROGRESS"
    (progress-form)
    [:div {:class "clear"}]
    (display-progress summary)))
