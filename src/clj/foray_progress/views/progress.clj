(ns clj.foray-progress.views.progress
  (:use [hiccup.core :only (h)]
        [hiccup.form :only (form-to label text-field radio-button submit-button)])
  (:require [clj.foray-progress.views.layout :as layout]))

(defn progress-form []
  [:div {:id "progress-form" :class "sixteen columns alpha omega"}
    (form-to [:post "/"]
      (label "progress" "Where are you in Joy of Clojure?")
      (label "username" "Username:")
      (text-field "username")
      (for [chapter (range 1 13)]
        [:div (radio-button (str "chapter-" chapter))
              (str "Chapter " chapter)])
      (submit-button "Save"))])

(defn display-progress [summary]
  [:table {:id "summary"}
    [:thead
      [:tr
        [:th "Chapter"]
        [:th "Count"]]]
    [:tbody
      (map #(
        [:tr
          [:td (:chapter %1)]
          [:td (:count %1)]]) summary)]])

(defn index [summary]
  (layout/common "PROGRESS"
    (progress-form)
    [:div {:class "clear"}]
    (display-progress summary)))
