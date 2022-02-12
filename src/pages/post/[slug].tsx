/* eslint-disable no-return-assign */
/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import format from 'date-fns/format';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/CommentsPosts';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  beforePost: {
    uid: string;
    title: string;
  };
  nextPost: {
    uid: string;
    title: string;
  };
}

export default function Post({ post, beforePost, nextPost }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const reducer = (valor1, valor2) => valor1 + valor2;
  const qtdWords = post.data.content.map(content => {
    const headingSplit = content.heading.split(' ');
    const bodyS = content.body.map(body => {
      const bodySplit = body.text.split(' ');
      return bodySplit.length;
    });
    const concatArr = bodyS.concat(headingSplit.length);
    return concatArr.reduce(reducer);
  });
  const soma = qtdWords.reduce(reducer);
  const total = Math.ceil(soma / 200);
  return (
    <>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <article className={`${commonStyles.container} ${styles.article}`}>
        <h1>{post.data.title}</h1>

        <div className={styles.subHeader}>
          <p>
            <FiCalendar />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </p>
          <p>
            <FiUser />
            {post.data.author}
          </p>
          <p>
            <FiClock />
            {total} min
          </p>
        </div>
        {post.last_publication_date && (
          <p className={styles.subHeader} style={{ fontStyle: 'italic' }}>
            * editado em{' '}
            {format(
              new Date(post.last_publication_date),
              "dd MMM yyyy', às ' HH:mm",
              {
                locale: ptBR,
              }
            )}
          </p>
        )}

        <div className={styles.body}>
          {post.data.content.map((content, index) => (
            <div key={`content-${index}`}>
              <h2>{content.heading}</h2>
              <div // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </div>
      </article>
      <div className={commonStyles.container}>
        <div className={styles.border} />
        <div className={styles.nextBeforePost}>
          {beforePost && (
            <div className={styles.beforePost}>
              <h2>{beforePost.title}</h2>
              <Link href={`/post/${beforePost.uid}`}>
                <p>Post anterior</p>
              </Link>
            </div>
          )}
          {nextPost && (
            <div className={styles.nextPost}>
              <h2>{nextPost.title}</h2>
              <Link href={`/post/${nextPost.uid}`}>
                <p>Próximo post</p>
              </Link>
            </div>
          )}
        </div>
      </div>
      <Comments />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 3 }
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();

  const response = await prismic.getByUID(
    'posts',
    String(context.params.slug),
    {}
  );
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
    }
  );
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      title: post.data.title,
    };
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };
  const indexItemSelecionado = posts.findIndex(x => x.uid === post.uid);
  const beforePost = posts[indexItemSelecionado - 1] || null;
  const nextPost = posts[indexItemSelecionado + 1] || null;
  return {
    props: { post, beforePost, nextPost },
    revalidate: 60 * 30, // 30 minutos
  };
};
