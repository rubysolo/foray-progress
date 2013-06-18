(ns clj.foray-progress.models.progress
  (:require [clojure.java.jdbc :as sql]))

(defn all []
  (sql/with-connection (System/getenv "DATABASE_URL")
    (sql/with-query-results results
      ["select * from progress order by id desc"]
      (into [] results))))

(defn summary []
  (sql/with-connection (System/getenv "DATABASE_URL")
    (sql/with-query-results results
      ["select chapter, count(*) as count from progress group by chapter order by count(*) desc"]
      (into [] results))))

(defn store [progress]
  (sql/with-connection (System/getenv "DATABASE_URL")
    (println progress)
    (sql/update-or-insert-values
      :progress
      ["user = ?" (:username progress)]
      progress)))
