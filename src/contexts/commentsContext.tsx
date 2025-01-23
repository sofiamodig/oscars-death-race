import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { arrayUnion, doc, getDoc, updateDoc } from "@firebase/firestore";
import { db } from "@/firebaseConfig";
import { useSnackbarContext } from "./snackbarContext";
import { useAuth } from "@/hooks/useAuth";

type Comment = {
  comment: string;
  imdbId: string;
};

type CommentsContextType = {
  comments: Comment[];
  addComment: (comment: Comment) => void;
  updateComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;
};

export const CommentsContext = createContext<CommentsContextType>({
  comments: [],
  addComment: () => {},
  updateComment: () => {},
  deleteComment: () => {},
});

export const useCommentsContext = () => useContext(CommentsContext);

interface CommentsProviderProps {
  children: ReactNode;
}

export const CommentsProvider: React.FC<CommentsProviderProps> = ({
  children,
}) => {
  const { userId } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const { showSnackbar } = useSnackbarContext();

  // Fetch comments from Firestore on mount
  useEffect(() => {
    const fetchComments = async () => {
      if (!userId) {
        return;
      }
      const docRef = doc(db, "users", userId);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setComments(data.Comments || []);
        }
      } catch (error: any) {
        showSnackbar(`Failed to fetch comments: ${error.message}`, "error");
      }
    };

    fetchComments();
  }, [showSnackbar, userId]);

  const addComment = async (comment: Comment) => {
    if (!userId) {
      return;
    }
    const docRef = doc(db, "users", userId);

    try {
      // Add comment to Firestore
      await updateDoc(docRef, {
        Comments: arrayUnion(comment),
      });

      // Update local state
      setComments((prevComments) => [...prevComments, comment]);
    } catch (error: any) {
      showSnackbar(`Failed to add comment: ${error.message}`, "error");
    }
  };

  const updateComment = async (updatedComment: Comment) => {
    if (!userId) {
      return;
    }
    const docRef = doc(db, "users", userId);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedComments = (data.Comments || []).map((comment: Comment) =>
          comment.imdbId === updatedComment.imdbId ? updatedComment : comment
        );

        // Update Firestore
        await updateDoc(docRef, { Comments: updatedComments });

        // Update local state
        setComments(updatedComments);
      }
    } catch (error: any) {
      showSnackbar(`Failed to update comment: ${error.message}`, "error");
    }
  };

  const deleteComment = async (imdbId: string) => {
    if (!userId) {
      return;
    }
    const docRef = doc(db, "users", userId);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Filter out the comment to be deleted
        const filteredComments = (data.Comments || []).filter(
          (comment: Comment) => comment.imdbId !== imdbId
        );
        // Update local state
        setComments(filteredComments);
      }
    } catch (error: any) {
      showSnackbar(`Failed to delete comment: ${error.message}`, "error");
    }
  };

  return (
    <CommentsContext.Provider
      value={{
        comments,
        addComment,
        updateComment,
        deleteComment,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
};
