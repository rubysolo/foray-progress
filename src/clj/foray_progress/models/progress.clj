(ns clj.foray-progress.models.progress
  (:require [clojure.java.jdbc :as sql]))

(def database-url
  (or (System/getenv "HEROKU_POSTGRESQL_BRONZE_URL")
      (System/getenv "DATABASE_URL")))

(defn all []
  (sql/with-connection database-url
    (sql/with-query-results results
      ["select * from progress order by id desc"]
      (into [] results))))

(defn summary []
  (sql/with-connection database-url
    (sql/with-query-results results
      ["select chapter, count(*) as count from progress group by chapter order by count(*) desc"]
      (into [] results))))

(defn store [progress]
  (let [p (assoc progress :chapter (Integer. (:chapter progress)))]
    (try
      (sql/with-connection database-url
        (sql/update-or-insert-values
          :progress
          ["username = ?" (:username p)]
          p))
      (catch Exception e
        (println (.getNextException e))))))
